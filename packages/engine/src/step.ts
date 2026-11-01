import type { World } from "@belvedere/content-schema";
import { evaluateAll } from "./conditions";
import { applyEffects } from "./effects";
import { resetRun } from "./qualities";
import { buildReport } from "./report";
import { seedRng } from "./rng";
import { choicesOf, selectStorylet } from "./select";
import { EngineError, STATE_VERSION, findStorylet, type GameState, type Profile } from "./state";
import { renderText } from "./text";
import { getQuality, setQuality } from "./qualities";

export type Action =
  | { type: "choose"; index: number }
  | { type: "continue" }
  | { type: "pledge"; pair: number }
  | { type: "newNight"; seed: number };

function enterLocation(state: GameState, world: World, location: string): GameState {
  const [storylet, rng] = selectStorylet(state, world, location, state.rng);
  if (!storylet) throw new EngineError(`no storylet available at location: ${location}`);
  return { ...state, rng, location, storyletId: storylet.id };
}

/** Starts a night from a saved profile (or a finished night's state). */
export function newNight(profile: Profile, world: World, seed: number): GameState {
  const base: GameState = {
    v: STATE_VERSION,
    seed,
    rng: seedRng(seed),
    phase: "scene",
    location: world.rules.start,
    storyletId: "",
    pendingChoice: null,
    run: {},
    profile: { ...profile.profile },
    log: [],
    report: {},
  };
  return enterLocation(resetRun(base), world, world.rules.start);
}

function endNight(state: GameState, world: World): GameState {
  const [report, rng] = buildReport(state, world, state.rng);
  const withEnd = applyEffects({ ...state, rng }, world, world.rules.onNightEnd);
  return { ...withEnd, phase: "report", report };
}

/** Applies a choice's effects. With an outcome text the state pauses in phase "outcome"
 *  until continueOutcome(); otherwise the move resolves immediately. */
export function choose(state: GameState, world: World, index: number): GameState {
  if (state.phase !== "scene") throw new EngineError("cannot choose outside a scene");
  const storylet = findStorylet(world, state.storyletId);
  const entry = choicesOf(state, world, storylet)[index];
  if (!entry?.available) throw new EngineError(`choice ${index} not available in ${storylet.id}`);
  const choice = storylet.choices[index]!;

  let next: GameState = { ...state, log: [...state.log, { storylet: storylet.id, choice: index }] };
  next = applyEffects(next, world, choice.effects);
  if (!choice.free) next = applyEffects(next, world, world.rules.onChoice);

  if (choice.outcome !== undefined) return { ...next, phase: "outcome", pendingChoice: index };
  return resolveChoice(next, world, index);
}

/** Leaves the outcome screen and performs the choice's goto / endNight. */
export function continueOutcome(state: GameState, world: World): GameState {
  if (state.phase !== "outcome" || state.pendingChoice === null) throw new EngineError("no outcome to continue");
  return resolveChoice({ ...state, phase: "scene", pendingChoice: null }, world, state.pendingChoice);
}

function resolveChoice(state: GameState, world: World, index: number): GameState {
  const choice = findStorylet(world, state.storyletId).choices[index]!;
  const ends = choice.endNight || (world.rules.nightEndWhen.length > 0 && evaluateAll(state, world, world.rules.nightEndWhen));
  if (ends) return endNight(state, world);
  return enterLocation(state, world, choice.goto ?? state.location);
}

/** Memory pairs whose false flag is currently 1, i.e. still available to pawn. */
export function pawnableMemories(state: GameState, world: World) {
  return world.memories
    .map((pair, index) => ({ pair, index }))
    .filter(({ pair }) => getQuality(state, world, pair.false) === 1);
}

/** Pawns a false memory: its flag goes to 0, the true flag goes to 1 if returnWhen holds,
 *  and the night ends. Only valid on a pledge-layout storylet. */
export function pledge(state: GameState, world: World, pairIndex: number): GameState {
  if (state.phase !== "scene") throw new EngineError("cannot pledge outside a scene");
  const storylet = findStorylet(world, state.storyletId);
  if (storylet.layout !== "pledge") throw new EngineError(`storylet ${storylet.id} is not a pledge screen`);
  const entry = pawnableMemories(state, world).find((m) => m.index === pairIndex);
  if (!entry) throw new EngineError(`memory pair ${pairIndex} not available to pawn`);

  let next: GameState = { ...state, log: [...state.log, { storylet: storylet.id, choice: -1, pair: pairIndex }] };
  next = setQuality(next, world, entry.pair.false, 0);
  if (evaluateAll(next, world, entry.pair.returnWhen)) next = setQuality(next, world, entry.pair.true, 1);
  return endNight(next, world);
}

export function step(state: GameState, world: World, action: Action): GameState {
  switch (action.type) {
    case "choose": return choose(state, world, action.index);
    case "continue": return continueOutcome(state, world);
    case "pledge": return pledge(state, world, action.pair);
    case "newNight": return newNight(state, world, action.seed);
  }
}

/** What the renderer needs for the current scene: rendered texts, every choice with
 *  availability (a doors layout shows locked ones), and pawnable memories for a pledge layout. */
export function currentScene(state: GameState, world: World) {
  const storylet = findStorylet(world, state.storyletId);
  return {
    storylet,
    text: renderText(storylet.text, state, world),
    choices: choicesOf(state, world, storylet).map((c) => ({ ...c, text: renderText(c.choice.text, state, world) })),
    memories: storylet.layout === "pledge"
      ? pawnableMemories(state, world).map((m) => ({ index: m.index, label: m.pair.label_false }))
      : [],
  };
}
export type SceneView = ReturnType<typeof currentScene>;

/** Outcome screen data (phase === "outcome"). */
export function currentOutcome(state: GameState, world: World) {
  if (state.phase !== "outcome" || state.pendingChoice === null) throw new EngineError("no outcome on screen");
  const storylet = findStorylet(world, state.storyletId);
  const choice = storylet.choices[state.pendingChoice]!;
  return { storylet, text: renderText(choice.outcome ?? "", state, world) };
}
export type ReportView = ReturnType<typeof currentReport>;

/** Report page data: slot -> fragment text, in slot order. */
export function currentReport(state: GameState, world: World) {
  return world.report.slots.map(({ id: slot, label }) => {
    const id = state.report[slot];
    const fragment = world.fragments.find((f) => f.id === id);
    if (!fragment) throw new EngineError(`report slot ${slot} has no fragment in state`);
    return { slot, label: label ?? slot, fragment, text: renderText(fragment.text, state, world) };
  });
}

/** Profile to persist between nights. */
export function profileOf(state: GameState): Profile {
  return { v: STATE_VERSION, profile: { ...state.profile } };
}
