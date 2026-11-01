import { RESERVED_QUALITIES, type World } from "@belvedere/content-schema";
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
  | { type: "pledge"; pair: string }
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

/** endNight wins; otherwise the first matching interrupt redirects; otherwise the choice's goto. */
function resolveChoice(state: GameState, world: World, index: number): GameState {
  const choice = findStorylet(world, state.storyletId).choices[index]!;
  if (choice.endNight) return endNight(state, world);
  const interrupt = world.rules.interrupts.find((i) => evaluateAll(state, world, i.when));
  return enterLocation(state, world, interrupt?.goto ?? choice.goto ?? state.location);
}

/** Memory pairs whose fake flag is currently 1, i.e. still available to pawn. */
export function pawnableMemories(state: GameState, world: World) {
  return world.memories.filter((pair) => getQuality(state, world, pair.fake) === 1);
}

/** Pawns a fake memory by pair id: fake flag -> 0, `pledged.<id>` -> 1; if returnWhen holds,
 *  real flag -> 1, `returned.<id>` -> 1 and `memories_returned` += 1. Then the night ends,
 *  with the report built while these run flags are still set. Only on a pledge-layout storylet. */
export function pledge(state: GameState, world: World, pairId: string): GameState {
  if (state.phase !== "scene") throw new EngineError("cannot pledge outside a scene");
  const storylet = findStorylet(world, state.storyletId);
  if (storylet.layout !== "pledge") throw new EngineError(`storylet ${storylet.id} is not a pledge screen`);
  const pair = pawnableMemories(state, world).find((m) => m.id === pairId);
  if (!pair) throw new EngineError(`memory pair ${pairId} not available to pawn`);

  const { pledgedPrefix, returnedPrefix, memoriesReturned } = RESERVED_QUALITIES;
  let next: GameState = { ...state, log: [...state.log, { storylet: storylet.id, choice: -1, pair: pairId }] };
  next = setQuality(next, world, pair.fake, 0);
  next = setQuality(next, world, pledgedPrefix + pair.id, 1);
  if (evaluateAll(next, world, pair.returnWhen)) {
    next = setQuality(next, world, pair.real, 1);
    next = setQuality(next, world, returnedPrefix + pair.id, 1);
    next = setQuality(next, world, memoriesReturned, getQuality(next, world, memoriesReturned) + 1);
  }
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
      ? pawnableMemories(state, world).map((m) => ({ id: m.id, label: m.label_fake }))
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
