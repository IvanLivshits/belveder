import {
  changedQualities, choiceCost, choose, clockTime, continueOutcome, currentNotes, currentOutcome, currentReport, currentScene, emptyProfile, endingView, evidenceView, getQuality,
  morningNotes, newCase, newNight, notebookView, pledge, profileOf, storyView, type GameState, type Profile,
} from "@belvedere/engine";
import { RESERVED_QUALITIES } from "@belvedere/content-schema";
import { Backdrop, ChoiceList, ConfirmSheet, DoorPicker, EndingPage, EvidencePage, Hint, MorningPage, NotebookPage, PledgePicker, QualityBar, ReportPage, SceneCard, StoryPage, TitleScreen, type LifeLineItem } from "@belvedere/ui-kit";
import { useCallback, useEffect, useState } from "preact/hooks";
import { loadContent, type Content } from "./content";
import { saves } from "./saves";
import { EMPTY_UI, type UiMeta } from "./storage";
import { confirmDialog, haptic, setBackButton, setSettingsButton } from "./telegram";

type Life = { title: string; intro: string; footer: string | null; lines: LifeLineItem[] };
type Screen =
  | { kind: "loading" } | { kind: "error"; message: string } | { kind: "title" } | { kind: "night" } | { kind: "notebook" }
  /** Evidence folder: the list, or one open card. */
  | { kind: "evidence"; item: string | null }
  /** The whole case as one page, after the ending screen. */
  | { kind: "story" }
  /** Between the report and the next night: the life page with tonight's changes. */
  | { kind: "morning"; life: Life; notes: string[] };

function randomSeed(): number {
  return (Math.random() * 0x100000000) >>> 0;
}

/** "1 ход", "2 хода", "5 ходов"; nothing for free choices. */
function costLabel(n: number): string | undefined {
  if (n <= 0) return undefined;
  const mod10 = n % 10, mod100 = n % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "ход" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "хода" : "ходов";
  return `${n} ${word}`;
}

export function App() {
  const [content, setContent] = useState<Content | null>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile());
  const [state, setState] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<Screen>({ kind: "loading" });
  const [ui, setUi] = useState<UiMeta>(EMPTY_UI);
  /** Tutorial hints waiting to be shown, first on screen. */
  const [hints, setHints] = useState<string[]>([]);
  /** Index of an ending choice waiting for the player's confirmation. */
  const [confirm, setConfirm] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const c = await loadContent();
        const p = (await saves.loadProfile()) ?? emptyProfile();
        const [run, meta] = await Promise.all([saves.loadRun(p), saves.loadUi()]);
        setContent(c);
        setProfile(p);
        setState(run);
        setUi(meta);
        setScreen({ kind: "title" });
      } catch (e) {
        setScreen({ kind: "error", message: (e as Error).message });
      }
    })();
  }, []);

  // Telegram BackButton: evidence card -> folder -> night, notebook -> night, night -> title (the run stays saved).
  const backKey = screen.kind === "evidence" ? `evidence:${screen.item ?? ""}` : screen.kind;
  useEffect(() => setBackButton(
    screen.kind === "night" || screen.kind === "notebook" || screen.kind === "evidence",
    () => setScreen(
      screen.kind === "evidence" ? (screen.item === null ? { kind: "night" } : { kind: "evidence", item: null })
        : screen.kind === "notebook" ? { kind: "night" } : { kind: "title" },
    ),
  ), [backKey]);
  const dismissHint = useCallback(() => setHints((h) => h.slice(1)), []);

  // Wipes every device: tombstones go to the cloud, other clients pick them up on their next load.
  const reset = useCallback(async () => {
    if (!(await confirmDialog("Стереть весь прогресс на всех устройствах? Ночи, воспоминания и блокнот начнутся заново."))) return;
    const fresh = saves.resetAll();
    setProfile(emptyProfile());
    setState(null);
    setUi(fresh);
    setHints([]);
    setScreen({ kind: "title" });
  }, []);
  // Telegram's gear opens the same reset; in a browser the link lives at the bottom of the notebook.
  useEffect(() => setSettingsButton(content !== null, () => void reset()), [content, reset]);

  if (screen.kind === "loading") return <div class="screen" />;
  if (screen.kind === "error" || !content) return <div class="screen"><p class="scene__text" style="padding:24px">Ошибка: {screen.kind === "error" ? screen.message : "нет контента"}</p></div>;
  const { world, src, assets } = content;
  /** Portraits are full 9:16 scenes and replace the background; a square image (evidence close-up)
   *  stays an inset over the background instead. Decided by the asset's own proportions. */
  const visuals = (storylet: { background: string; portrait?: string | undefined; location: string }) => {
    const p = storylet.portrait ? assets[storylet.portrait] : undefined;
    const isScene = p !== undefined && p.h > p.w;
    const outdoor = world.locations.find((l) => l.id === storylet.location)?.outdoor ?? false;
    return { src: src(isScene ? storylet.portrait : storylet.background), inset: p && !isScene ? src(storylet.portrait) : undefined, rain: outdoor };
  };
  const saveUi = (next: UiMeta) => { setUi(next); saves.persistUi(next); };

  const startNight = () => {
    const s = newNight(profile, world, randomSeed());
    setState(s);
    setScreen({ kind: "night" });
    saves.persistRun(s);
  };

  const paper = src("paper_dark");
  const texture = paper ? `url(${paper})` : undefined;
  const hint = hints[0] !== undefined && <Hint text={hints[0]} onDismiss={dismissHint} />;
  const paperHint = hints[0] !== undefined && <Hint text={hints[0]} onDismiss={dismissHint} placement="bottom" />;

  // The case is over: the ending screen, then the story, then a fresh case that keeps only endings.*.
  if (state?.phase === "ending" && state.ending !== null) {
    const endingId = state.ending;
    if (screen.kind === "story") {
      const story = storyView(profileOf(state), world, endingId);
      const startCase = () => {
        const p = newCase(profileOf(state));
        const fresh = saves.resetAll(); // tombstones + a higher ui epoch, so other devices drop the old notebook reads too
        saves.persistProfile(p);
        const meta = { ...fresh, hintsShown: ui.hintsShown };
        saves.persistUi(meta);
        setProfile(p);
        setState(null);
        setUi(meta);
        setHints([]);
        setScreen({ kind: "title" });
      };
      return (
        <div class="screen">
          <StoryPage title={story.title} sections={story.sections} nightLabel={(n) => `Ночь ${n}`} nextLabel="Новое дело" onNext={startCase} texture={texture} />
        </div>
      );
    }
    const ending = endingView(state, world);
    return (
      <div class="screen">
        <EndingPage src={src(ending.image)} title={ending.title} paragraphs={ending.paragraphs} epilogues={ending.epilogues} nextLabel={world.endings?.story.title ?? "Дальше"} onNext={() => setScreen({ kind: "story" })} />
      </div>
    );
  }

  if (screen.kind === "morning") {
    return (
      <div class="screen">
        <MorningPage title="Утро" life={screen.life} notes={screen.notes} nextLabel="Следующая ночь" onNext={startNight} texture={texture} />
      </div>
    );
  }

  if (screen.kind === "title" || !state) {
    return (
      <div class="screen">
        <TitleScreen
          coverSrc={src("cover")}
          canContinue={state !== null}
          nights={getQuality({ run: {}, profile: profile.profile }, world, "nights")}
          onContinue={() => setScreen({ kind: "night" })}
          onNewNight={startNight}
        />
      </div>
    );
  }

  if (screen.kind === "notebook") {
    const nb = notebookView(state, world);
    if (!nb) { setScreen({ kind: "night" }); return <div class="screen" />; }
    return (
      <div class="screen">
        <NotebookPage
          {...nb}
          ruleLabel="Как это работает"
          lockedLabel={(n) => `Ещё страниц: ${n}`}
          backLabel="Назад"
          onBack={() => setScreen({ kind: "night" })}
          resetLabel="Сбросить прогресс"
          onReset={() => void reset()}
          texture={texture}
        />
      </div>
    );
  }

  if (screen.kind === "evidence") {
    const ev = evidenceView(state, world);
    return (
      <div class="screen">
        <EvidencePage
          title="Улики"
          items={ev.items.map((i) => ({ ...i, image: i.image ? src(i.image) : undefined }))}
          locked={ev.locked}
          selected={screen.item}
          onSelect={(item) => setScreen({ kind: "evidence", item })}
          onBack={() => setScreen({ kind: "night" })}
          tonightLabel="сегодня"
          lockedLabel={(n) => `Ещё улик: ${n}`}
          backLabel="Назад"
          texture={texture}
        />
      </div>
    );
  }

  if (state.phase === "report") {
    const entries = currentReport(state, world).map((r) => ({ slot: r.slot, label: r.label, text: r.text }));
    // The morning page is built from the report state, while tonight's pledged.*/returned.* flags are still set.
    const finish = () => {
      const p = profileOf(state);
      const nb = notebookView(state, world);
      const { pledgedPrefix, returnedPrefix } = RESERVED_QUALITIES;
      const life: Life | null = nb && {
        ...nb.life,
        lines: nb.life.lines.map((l) => ({
          ...l,
          animate: getQuality(state, world, returnedPrefix + l.pair) === 1 ? "return" : getQuality(state, world, pledgedPrefix + l.pair) === 1 ? "strike" : undefined,
        })),
      };
      setProfile(p);
      setState(null);
      setScreen(life ? { kind: "morning", life, notes: morningNotes(state, world) } : { kind: "title" });
      saves.clearRun();
      saves.persistProfile(p);
    };
    return (
      <div class="screen">
        <ReportPage title="Отчёт за ночь" notes={currentNotes(state, world)} entries={entries} nextLabel="К утру" onNext={finish} texture={texture} />
        {paperHint}
      </div>
    );
  }

  // Every move goes through here. Profile qualities can change mid-night (trust, visits), so both
  // docs are saved every time. Writes are fire-and-forget: local first, cloud queued behind.
  // A quality that moves for the first time in the whole game queues its `hint`.
  const advance = (next: GameState) => {
    haptic();
    const changed = changedQualities(state, next, world);
    // Declaration order in world.qualities, so the most basic hint (the clock) comes first.
    const fresh = world.qualities
      .filter((q) => q.hint !== undefined && changed.includes(q.id) && !ui.hintsShown.includes(q.id))
      .map((q) => ({ id: q.id, hint: q.hint! }));
    if (fresh.length > 0) {
      setHints((h) => [...h, ...fresh.map((q) => q.hint)]);
      saveUi({ ...ui, hintsShown: [...ui.hintsShown, ...fresh.map((q) => q.id)] });
    }
    setState(next);
    saves.persistRun(next);
    saves.persistProfile(profileOf(next));
  };
  // The clock quality shows wall-clock time ("23:30") with "Ход 3/16" as its small-caps label.
  const time = clockTime(state, world);
  const hud = world.qualities
    .filter((q) => q.visible)
    .map((q) => {
      const value = getQuality(state, world, q.id);
      const label = q.label ?? q.id;
      if (time !== null && q.id === world.rules.clock?.quality) return { label: `${label} ${value}${q.max !== undefined ? `/${q.max}` : ""}`, value, display: time };
      return { label, value, max: q.max };
    });
  const ev = world.evidence.items.length > 0 ? evidenceView(state, world) : null;
  const evidenceUnread = ev !== null && ev.items.some((i) => !ui.evidenceSeen.includes(i.id));
  const openEvidence = ev
    ? () => {
        const ids = ev.items.map((i) => i.id);
        if (ids.some((id) => !ui.evidenceSeen.includes(id))) saveUi({ ...ui, evidenceSeen: [...new Set([...ui.evidenceSeen, ...ids])] });
        setScreen({ kind: "evidence", item: null });
      }
    : undefined;
  const nb = notebookView(state, world);
  const unread = nb !== null && nb.pages.some((p) => !ui.pagesRead.includes(p.id));
  const openNotebook = nb
    ? () => {
        const ids = nb.pages.map((p) => p.id);
        if (ids.some((id) => !ui.pagesRead.includes(id))) saveUi({ ...ui, pagesRead: [...new Set([...ui.pagesRead, ...ids])] });
        setScreen({ kind: "notebook" });
      }
    : undefined;
  const bar = <QualityBar items={hud} onNotebook={openNotebook} badge={unread} notebookLabel="Блокнот" onEvidence={openEvidence} evidenceBadge={evidenceUnread} evidenceLabel="Улики" />;

  if (state.phase === "outcome") {
    const out = currentOutcome(state, world);
    return (
      <div class="screen">
        <Backdrop {...visuals(out.storylet)}>
          {bar}
          {hint}
          <SceneCard title={out.storylet.title} text={out.text}>
            <ChoiceList choices={[{ index: 0, text: "Дальше", available: true }]} onChoose={() => advance(continueOutcome(state, world))} />
          </SceneCard>
        </Backdrop>
      </div>
    );
  }

  const scene = currentScene(state, world);
  const items = scene.choices.map((c) => ({ index: c.index, text: c.text, available: c.available, cost: costLabel(choiceCost(state, world, c.choice)) }));
  // An ending choice asks first; there is no way back after it.
  const onChoose = (index: number) => (scene.storylet.choices[index]?.ending !== undefined ? setConfirm(index) : advance(choose(state, world, index)));
  const confirmSheet = confirm !== null && (
    <ConfirmSheet
      text="Это финал дела. Дальше пути назад не будет."
      okLabel="Закончить дело"
      cancelLabel="Ещё нет"
      onOk={() => { const i = confirm; setConfirm(null); advance(choose(state, world, i)); }}
      onCancel={() => setConfirm(null)}
    />
  );
  const picker = scene.storylet.layout === "doors"
    ? <DoorPicker doors={items} onChoose={onChoose} />
    : scene.storylet.layout === "pledge"
      ? <PledgePicker memories={scene.memories} readyLabel="Кажется, это есть чем заменить" onPledge={(id) => advance(pledge(state, world, id))} choices={items} onChoose={onChoose} />
      : <ChoiceList choices={items} onChoose={onChoose} />;

  return (
    <div class="screen">
      <Backdrop {...visuals(scene.storylet)}>
        {bar}
        {hint}
        <SceneCard title={scene.storylet.title} text={scene.text}>
          {picker}
        </SceneCard>
        {confirmSheet}
      </Backdrop>
    </div>
  );
}
