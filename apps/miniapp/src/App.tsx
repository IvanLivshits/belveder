import {
  changedQualities, choiceCost, choose, continueOutcome, currentNotes, currentOutcome, currentReport, currentScene, emptyProfile, getQuality,
  newNight, notebookView, pledge, profileOf, type GameState, type Profile,
} from "@belvedere/engine";
import { Backdrop, ChoiceList, DoorPicker, Hint, NotebookPage, PledgePicker, QualityBar, ReportPage, SceneCard, TitleScreen } from "@belvedere/ui-kit";
import { useCallback, useEffect, useState } from "preact/hooks";
import { loadContent, type Content } from "./content";
import { saves } from "./saves";
import type { UiMeta } from "./storage";
import { haptic, setBackButton } from "./telegram";

type Screen = { kind: "loading" } | { kind: "error"; message: string } | { kind: "title" } | { kind: "night" } | { kind: "notebook" };

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
  const [ui, setUi] = useState<UiMeta>({ hintsShown: [], pagesRead: [] });
  /** Tutorial hints waiting to be shown, first on screen. */
  const [hints, setHints] = useState<string[]>([]);

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

  // Telegram BackButton: notebook -> night, night -> title (the run stays saved).
  useEffect(() => setBackButton(
    screen.kind === "night" || screen.kind === "notebook",
    () => setScreen(screen.kind === "notebook" ? { kind: "night" } : { kind: "title" }),
  ), [screen.kind]);
  const dismissHint = useCallback(() => setHints((h) => h.slice(1)), []);

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

  const paper = src("paper_dark");
  const texture = paper ? `url(${paper})` : undefined;
  const hint = hints[0] !== undefined && <Hint text={hints[0]} onDismiss={dismissHint} />;
  const paperHint = hints[0] !== undefined && <Hint text={hints[0]} onDismiss={dismissHint} placement="bottom" />;

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
          texture={texture}
        />
      </div>
    );
  }

  if (state.phase === "report") {
    const entries = currentReport(state, world).map((r) => ({ slot: r.slot, label: r.label, text: r.text }));
    const finish = () => {
      const p = profileOf(state);
      setProfile(p);
      setState(null);
      setScreen({ kind: "title" });
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
  const hud = world.qualities
    .filter((q) => q.visible)
    .map((q) => ({ label: q.label ?? q.id, value: getQuality(state, world, q.id), max: q.max }));
  const nb = notebookView(state, world);
  const unread = nb !== null && nb.pages.some((p) => !ui.pagesRead.includes(p.id));
  const openNotebook = nb
    ? () => {
        const ids = nb.pages.map((p) => p.id);
        if (ids.some((id) => !ui.pagesRead.includes(id))) saveUi({ ...ui, pagesRead: [...new Set([...ui.pagesRead, ...ids])] });
        setScreen({ kind: "notebook" });
      }
    : undefined;
  const bar = <QualityBar items={hud} onNotebook={openNotebook} badge={unread} notebookLabel="Блокнот" />;

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
  const onChoose = (index: number) => advance(choose(state, world, index));
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
      </Backdrop>
    </div>
  );
}
