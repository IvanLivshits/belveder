import {
  changedQualities, choiceCost, choose, clockTime, continueOutcome, currentNotes, currentReport, currentRumor, currentScene, emptyProfile, endingView, evidenceView, extendFeed, findStorylet, getQuality,
  isResumable, morningNotes, newCase, newNight, notebookView, openFeed, pledge, profileOf, progressNotes, storyView, tensionLevel, travel, type Feed, type GameState, type NotebookView, type Profile,
} from "@belvedere/engine";
import { RESERVED_QUALITIES } from "@belvedere/content-schema";
import { type AnimationKind, Backdrop, ChoiceList, ConfirmSheet, DoorPicker, EndingPage, EvidencePage, Hint, MorningPage, NotebookPage, PledgePicker, QualityBar, ReportPage, SceneCard, StairsPicker, StoryPage, TitleScreen, type LifeLineItem } from "@belvedere/ui-kit";
import { useCallback, useEffect, useState } from "preact/hooks";
import { initAudio, isSoundOn, playCue, playLighter, setSoundOn, setTension, stopCue } from "./audio";
import { loadContent, type Content } from "./content";
import { saves } from "./saves";
import { EMPTY_UI, type UiMeta } from "./storage";
import { confirmDialog, haptic, setBackButton, setSettingsButton } from "./telegram";

type Life = { title: string; intro: string; footer: string | null; lines: LifeLineItem[] };
type Screen =
  | { kind: "loading" } | { kind: "error"; message: string } | { kind: "title" } | { kind: "night" }
  /** Notebook: the leads tab or the pages tab. */
  | { kind: "notebook"; tab: "leads" | "pages" }
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
  /** An envelope nothing would replace, waiting for the player to confirm the loss. */
  const [pledgeConfirm, setPledgeConfirm] = useState<{ id: string; label: string } | null>(null);
  /** The transcript of the place the player is in, and how many of its entries are already on screen. */
  const [feed, setFeed] = useState<Feed>({ location: "", entries: [] });
  const [shown, setShown] = useState(0);
  const [soundOn, setSoundOnState] = useState(isSoundOn);
  const toggleSound = () => { setSoundOn(!soundOn); setSoundOnState(!soundOn); };

  useEffect(() => {
    (async () => {
      try {
        const c = await loadContent();
        const p = (await saves.loadProfile()) ?? emptyProfile();
        const [saved, meta] = await Promise.all([saves.loadRun(p), saves.loadUi()]);
        // A run saved on older content may stand on a card that no longer exists: the night is dropped, the profile stays.
        const run = saved && isResumable(saved, c.world) ? saved : null;
        if (saved && !run) saves.clearRun();
        setContent(c);
        initAudio();
        setProfile(p);
        setState(run);
        if (run) setFeed(openFeed(run, c.world));
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
  const reveal = useCallback((n: number) => setShown((cur) => Math.max(cur, n)), []);

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
  // The music follows the run: the tension level from rules.tension, but only while the night is being played
  // (scene or outcome, on the night, notebook or evidence screens). The title, the report, the morning page,
  // the ending and the case story are always calm, even when a saved night is still in state.
  const playing = (screen.kind === "night" || screen.kind === "notebook" || screen.kind === "evidence")
    && (state?.phase === "scene" || state?.phase === "outcome");
  const tension = playing && content !== null && state !== null ? tensionLevel(state, content.world) : 0;
  useEffect(() => setTension(tension), [tension]);

  if (screen.kind === "loading") return <div class="screen screen--loading">Загрузка…</div>;
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
  const leadIds = (nb: NotebookView) => [...nb.leads.open, ...nb.leads.closed].map((l) => l.id);
  /** Opens a notebook tab. Showing a tab reads it: the dot on the other tab stays until that one is opened. */
  const showNotebook = (nb: NotebookView, tab: "leads" | "pages") => {
    const ids = tab === "leads" ? leadIds(nb) : nb.pages.map((p) => p.id);
    const key = tab === "leads" ? "leadsSeen" : "pagesRead";
    if (ids.some((id) => !ui[key].includes(id))) saveUi({ ...ui, [key]: [...new Set([...ui[key], ...ids])] });
    setScreen({ kind: "notebook", tab });
  };

  /** The morning page's pencil: the crossing out of a memory, then, when it was exchanged, the writing of the new one. */
  const pencil = (kind: AnimationKind, on: boolean) => {
    const cue = kind === "strike" ? "pencil_crossing_out" : "pencil_writing";
    if (on) playCue(cue); // when the animation ends the sound plays out; leaving the page cuts it (startNight)
  };

  const startNight = () => {
    stopCue("pencil_crossing_out");
    stopCue("pencil_writing");
    playLighter();
    const s = newNight(profile, world, randomSeed());
    setState(s);
    setFeed(openFeed(s, world));
    setShown(0);
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
        <MorningPage title="Утро" life={screen.life} notes={screen.notes} nextLabel="Следующая ночь" onNext={startNight} texture={texture} onAnimate={pencil} />
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
          soundLabel={soundOn ? "Звук: вкл" : "Звук: выкл"}
          onToggleSound={toggleSound}
        />
      </div>
    );
  }

  if (screen.kind === "notebook") {
    const nb = notebookView(state, world);
    if (!nb) { setScreen({ kind: "night" }); return <div class="screen" />; }
    const hasLeads = (world.notebook?.leads.length ?? 0) > 0;
    return (
      <div class="screen">
        <NotebookPage
          {...nb}
          tabs={hasLeads ? [
            { id: "leads", label: "Зацепки", badge: leadIds(nb).some((id) => !ui.leadsSeen.includes(id)) },
            { id: "pages", label: "Блокнот", badge: nb.pages.some((p) => !ui.pagesRead.includes(p.id)) },
          ] : undefined}
          tab={hasLeads ? screen.tab : "pages"}
          onTab={(id) => showNotebook(nb, id === "leads" ? "leads" : "pages")}
          leads={hasLeads ? { open: nb.leads.open, closed: nb.leads.closed, emptyLabel: "Пока ни одной зацепки." } : undefined}
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
        <ReportPage title="Отчёт за ночь" notes={currentNotes(state, world)} entries={entries} progress={progressNotes(state, world)} nextLabel="К утру" onNext={finish} texture={texture} />
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
    const nextFeed = extendFeed(feed, state, next, world);
    if (nextFeed.location !== feed.location) setShown(0);
    setFeed(nextFeed);
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
  const evidenceUnread = ev?.items.some((i) => !ui.evidenceSeen.includes(i.id));
  const openEvidence = ev
    ? () => {
        const ids = ev.items.map((i) => i.id);
        if (ids.some((id) => !ui.evidenceSeen.includes(id))) saveUi({ ...ui, evidenceSeen: [...new Set([...ui.evidenceSeen, ...ids])] });
        setScreen({ kind: "evidence", item: null });
      }
    : undefined;
  const nb = notebookView(state, world);
  const leadsUnread = nb !== null && leadIds(nb).some((id) => !ui.leadsSeen.includes(id));
  const unread = leadsUnread || nb?.pages.some((p) => !ui.pagesRead.includes(p.id));
  // The notebook opens on the leads when there is a new one (or nothing new at all), on the pages otherwise.
  const openNotebook = nb ? () => showNotebook(nb, leadIds(nb).length > 0 && (leadsUnread || !unread) ? "leads" : "pages") : undefined;
  const rumor = currentRumor(state, world);
  // The speech-bubble icon repeats tonight's rumor as a hint (once on screen, a second tap adds nothing).
  const showRumor = rumor ? () => setHints((h) => (h.includes(rumor.text) ? h : [rumor.text, ...h])) : undefined;
  const bar = <QualityBar items={hud} onNotebook={openNotebook} badge={unread} notebookLabel="Блокнот" onEvidence={openEvidence} evidenceBadge={evidenceUnread} evidenceLabel="Улики" onRumor={showRumor} rumorLabel="Слух дня" onSound={toggleSound} soundOn={soundOn} soundLabel={soundOn ? "Звук: вкл" : "Звук: выкл"} />;
  const card = findStorylet(world, state.storyletId);

  // A reply that leads elsewhere (or ends the night) is read where it was said, then "Дальше".
  if (state.phase === "outcome") {
    return (
      <div class="screen">
        <Backdrop {...visuals(card)}>
          {bar}
          {hint}
          <SceneCard title={card.title} entries={feed.entries} shown={shown} onReveal={reveal}>
            <ChoiceList choices={[{ index: 0, text: "Дальше", available: true }]} onChoose={() => advance(continueOutcome(state, world))} />
          </SceneCard>
        </Backdrop>
      </div>
    );
  }

  const scene = currentScene(state, world);
  // No cost on an ending: time after the finale does not matter.
  const item = (c: (typeof scene.choices)[number]) => ({ index: c.index, text: c.text, mode: c.mode, available: c.available, lead: c.lead, cost: c.choice.ending !== undefined ? undefined : costLabel(choiceCost(state, world, c.choice)) });
  const items = scene.choices.map(item);
  // An ending choice asks first; there is no way back after it.
  const pick = (index: number) => {
    const cue = scene.storylet.choices[index]?.cue;
    if (cue !== undefined) playCue(cue);
    advance(choose(state, world, index));
  };
  const onChoose = (index: number) => (scene.storylet.choices[index]?.ending !== undefined ? setConfirm(index) : pick(index));
  const confirmSheet = confirm !== null ? (
    <ConfirmSheet
      text="Это финал дела. Дальше пути назад не будет."
      okLabel="Закончить дело"
      cancelLabel="Ещё нет"
      onOk={() => { const i = confirm; setConfirm(null); pick(i); }}
      onCancel={() => setConfirm(null)}
    />
  ) : pledgeConfirm !== null && (
    <ConfirmSheet
      text={`Взамен ничего не встанет. „${pledgeConfirm.label}“ пропадёт насовсем.`}
      okLabel="Отдать"
      cancelLabel="Передумать"
      primary="cancel"
      onOk={() => { const id = pledgeConfirm.id; setPledgeConfirm(null); advance(pledge(state, world, id)); }}
      onCancel={() => setPledgeConfirm(null)}
    />
  );
  // An envelope with nothing to replace it is a loss for good: Dolly says so first (the notebook's pledge rule).
  const onPledge = (id: string) => {
    const m = scene.memories.find((x) => x.id === id);
    if (m && !m.canReturn) setPledgeConfirm({ id, label: m.label });
    else advance(pledge(state, world, id));
  };
  const stairs = scene.stairs;
  const picker = scene.storylet.layout === "doors"
    ? <DoorPicker doors={scene.doors.map(item)} onChoose={onChoose} />
    : scene.storylet.layout === "pledge"
      ? <PledgePicker memories={scene.memories} readyLabel="Кажется, это есть чем заменить" onPledge={onPledge} choices={items} onChoose={onChoose} />
      : stairs
        ? (
          <StairsPicker
            floors={[
              ...stairs.floors.map((f) => ({ floor: f.floor, cost: costLabel(f.cost), locked: f.locked !== null, lead: f.lead })),
              ...(stairs.back ? [{ floor: stairs.back.floor, current: true }] : []),
            ]}
            notes={stairs.floors.filter((f) => f.locked !== null).map((f) => `${f.floor} · ${f.locked}`)}
            hereLabel="здесь"
            onTravel={(floor) => advance(travel(state, world, floor))}
            backLabel={stairs.back ? "Обратно на площадку" : undefined}
            onBack={stairs.back ? () => advance(travel(state, world, stairs.current)) : undefined}
          />
        )
        : <ChoiceList choices={items} onChoose={onChoose} />;

  return (
    <div class="screen">
      <Backdrop {...visuals(scene.storylet)}>
        {bar}
        {hint}
        <SceneCard title={scene.storylet.title} entries={feed.entries} shown={shown} onReveal={reveal}>
          {picker}
        </SceneCard>
        {confirmSheet}
      </Backdrop>
    </div>
  );
}
