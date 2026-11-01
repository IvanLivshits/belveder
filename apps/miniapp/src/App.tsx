import { choose, continueOutcome, currentOutcome, currentReport, currentScene, emptyProfile, getQuality, newNight, pledge, profileOf, type GameState, type Profile } from "@belvedere/engine";
import { Backdrop, ChoiceList, DoorPicker, PledgePicker, QualityBar, ReportPage, SceneCard, TitleScreen } from "@belvedere/ui-kit";
import { useEffect, useState } from "preact/hooks";
import { loadContent, type Content } from "./content";
import { saves } from "./saves";
import { haptic, setBackButton } from "./telegram";

type Screen = { kind: "loading" } | { kind: "error"; message: string } | { kind: "title" } | { kind: "night" };

function randomSeed(): number {
  return (Math.random() * 0x100000000) >>> 0;
}

export function App() {
  const [content, setContent] = useState<Content | null>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile());
  const [state, setState] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<Screen>({ kind: "loading" });

  useEffect(() => {
    (async () => {
      try {
        const c = await loadContent();
        const p = (await saves.loadProfile()) ?? emptyProfile();
        const run = await saves.loadRun(p);
        setContent(c);
        setProfile(p);
        setState(run);
        setScreen({ kind: "title" });
      } catch (e) {
        setScreen({ kind: "error", message: (e as Error).message });
      }
    })();
  }, []);

  // Telegram BackButton: from a night back to the title; the run stays saved.
  useEffect(() => setBackButton(screen.kind === "night", () => setScreen({ kind: "title" })), [screen.kind]);

  if (screen.kind === "loading") return <div class="screen" />;
  if (screen.kind === "error" || !content) return <div class="screen"><p class="scene__text" style="padding:24px">Ошибка: {screen.kind === "error" ? screen.message : "нет контента"}</p></div>;
  const { world, src } = content;

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
    const paper = src("paper_dark");
    return (
      <div class="screen">
        <ReportPage title="Отчёт за ночь" entries={entries} nextLabel="К утру" onNext={finish} texture={paper ? `url(${paper})` : undefined} />
      </div>
    );
  }

  // Every move goes through here. Profile qualities can change mid-night (trust, visits), so both
  // docs are saved every time. Writes are fire-and-forget: local first, cloud queued behind.
  const advance = (next: GameState) => {
    haptic();
    setState(next);
    saves.persistRun(next);
    saves.persistProfile(profileOf(next));
  };
  const hud = world.qualities
    .filter((q) => q.visible)
    .map((q) => ({ label: q.label ?? q.id, value: getQuality(state, world, q.id), max: q.max }));

  // Portraits are full 9:16 scenes with the character in them, so one replaces the background.
  if (state.phase === "outcome") {
    const out = currentOutcome(state, world);
    return (
      <div class="screen">
        <Backdrop src={src(out.storylet.portrait ?? out.storylet.background)}>
          <QualityBar items={hud} />
          <SceneCard title={out.storylet.title} text={out.text}>
            <ChoiceList choices={[{ index: 0, text: "Дальше", available: true }]} onChoose={() => advance(continueOutcome(state, world))} />
          </SceneCard>
        </Backdrop>
      </div>
    );
  }

  const scene = currentScene(state, world);
  const items = scene.choices.map((c) => ({ index: c.index, text: c.text, available: c.available }));
  const onChoose = (index: number) => advance(choose(state, world, index));
  const picker = scene.storylet.layout === "doors"
    ? <DoorPicker doors={items} onChoose={onChoose} />
    : scene.storylet.layout === "pledge"
      ? <PledgePicker memories={scene.memories} onPledge={(i) => advance(pledge(state, world, i))} choices={items} onChoose={onChoose} />
      : <ChoiceList choices={items} onChoose={onChoose} />;

  return (
    <div class="screen">
      <Backdrop src={src(scene.storylet.portrait ?? scene.storylet.background)}>
        <QualityBar items={hud} />
        <SceneCard title={scene.storylet.title} text={scene.text}>
          {picker}
        </SceneCard>
      </Backdrop>
    </div>
  );
}
