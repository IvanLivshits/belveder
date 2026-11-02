import { RESERVED_QUALITIES, placeholders, qualityMatches, type World } from "@belvedere/content-schema";
import { evaluateAll } from "./conditions";
import { applyEffects } from "./effects";
import { recordEvidence } from "./evidence";
import { resetRun } from "./qualities";
import { buildReport } from "./report";
import { seedRng } from "./rng";
import { choicesOf, selectStorylet } from "./select";
import { EngineError, STATE_VERSION, findStorylet, type GameState, type NightRecord, type Profile } from "./state";
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
    history: { nights: [...(profile.history?.nights ?? [])], pledges: [...(profile.history?.pledges ?? [])] },
    ending: null,
  };
  return enterLocation(resetRun(base), world, world.rules.start);
}

/** Builds the report, applies onNightEnd and appends the night to the history (with the
 *  values of every placeholder the chosen fragments use, so the story can render them later). */
function endNight(state: GameState, world: World, pair?: string): GameState {
  const [report, rng] = buildReport(state, world, state.rng);
  const values: Record<string, number> = {};
  for (const id of Object.values(report)) {
    for (const ph of placeholders(world.fragments.find((f) => f.id === id)?.text ?? "")) {
      if (world.qualities.some((q) => qualityMatches(q.id, ph))) values[ph] = getQuality(state, world, ph);
    }
  }
  const pledged = world.rules.pledgedNightWhen !== undefined && evaluateAll(state, world, world.rules.pledgedNightWhen);
  const record: NightRecord = { pledged, ...(pair !== undefined ? { pair } : {}), report, values };
  const withEnd = applyEffects({ ...state, rng }, world, world.rules.onNightEnd);
  return { ...withEnd, phase: "report", report, history: { nights: [...state.history.nights, record], pledges: state.history.pledges } };
}

/** An ending choice: `endings.<id> = 1`, then the night closes like any other (report, onNightEnd,
 *  history) and the phase becomes "ending". The profile keeps everything until `newCase`. */
function finishGame(state: GameState, world: World, ending: string): GameState {
  const flagged = setQuality(state, world, RESERVED_QUALITIES.endingPrefix + ending, 1);
  return { ...endNight(flagged, world), phase: "ending", ending };
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
  next = recordEvidence(next, world);

  if (choice.outcome !== undefined) return { ...next, phase: "outcome", pendingChoice: index };
  return resolveChoice(next, world, index);
}

/** Leaves the outcome screen and performs the choice's goto / endNight. */
export function continueOutcome(state: GameState, world: World): GameState {
  if (state.phase !== "outcome" || state.pendingChoice === null) throw new EngineError("no outcome to continue");
  return resolveChoice({ ...state, phase: "scene", pendingChoice: null }, world, state.pendingChoice);
}

/** An ending finishes the game; endNight wins over interrupts; otherwise the first matching interrupt redirects; otherwise the choice's goto. */
function resolveChoice(state: GameState, world: World, index: number): GameState {
  const choice = findStorylet(world, state.storyletId).choices[index]!;
  if (choice.ending !== undefined) return finishGame(state, world, choice.ending);
  if (choice.endNight) return endNight(state, world);
  const interrupt = world.rules.interrupts.find((i) => evaluateAll(state, world, i.when));
  return enterLocation(state, world, interrupt?.goto ?? choice.goto ?? state.location);
}

/** Memory pairs whose fake flag is currently 1, i.e. still available to pawn. */
export function pawnableMemories(state: GameState, world: World) {
  return world.memories.filter((pair) => getQuality(state, world, pair.fake) === 1);
}

/** Pawnable pairs with `canReturn`: whether pledging right now would bring the real memory back.
 *  The UI may highlight such an envelope without saying what returns. */
export function pledgeOptions(state: GameState, world: World) {
  return pawnableMemories(state, world).map((pair) => ({
    id: pair.id,
    label: pair.label_fake,
    canReturn: evaluateAll(state, world, pair.returnWhen),
  }));
}

/** Pawns a fake memory by pair id: fake flag -> 0, `pledged.<id>` -> 1; if returnWhen holds,
 *  real flag -> 1, `returned.<id>` -> 1, `returned_tonight` -> 1 and `memories_returned` += 1. Then the night ends,
 *  with the report built while these run flags are still set. Only on a pledge-layout storylet. */
export function pledge(state: GameState, world: World, pairId: string): GameState {
  if (state.phase !== "scene") throw new EngineError("cannot pledge outside a scene");
  const storylet = findStorylet(world, state.storyletId);
  if (storylet.layout !== "pledge") throw new EngineError(`storylet ${storylet.id} is not a pledge screen`);
  const pair = pawnableMemories(state, world).find((m) => m.id === pairId);
  if (!pair) throw new EngineError(`memory pair ${pairId} not available to pawn`);

  const { pledgedPrefix, returnedPrefix, returnedTonight, memoriesReturned } = RESERVED_QUALITIES;
  let next: GameState = {
    ...state,
    log: [...state.log, { storylet: storylet.id, choice: -1, pair: pairId }],
    history: { nights: state.history.nights, pledges: [...state.history.pledges, pairId] },
  };
  next = setQuality(next, world, pair.fake, 0);
  next = setQuality(next, world, pledgedPrefix + pair.id, 1);
  if (evaluateAll(next, world, pair.returnWhen)) {
    next = setQuality(next, world, pair.real, 1);
    next = setQuality(next, world, returnedPrefix + pair.id, 1);
    next = setQuality(next, world, returnedTonight, 1);
    next = setQuality(next, world, memoriesReturned, getQuality(next, world, memoriesReturned) + 1);
  }
  return endNight(next, world, pairId);
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
    memories: storylet.layout === "pledge" ? pledgeOptions(state, world) : [],
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

/** Report notes whose conditions hold, rendered, in content order. */
export function currentNotes(state: GameState, world: World): string[] {
  return world.report.notes.filter((n) => evaluateAll(state, world, n.when)).map((n) => renderText(n.text, state, world));
}

/** Morning notes, evaluated on the report state so `pledged.*`, `returned_tonight` and `night_pledged` are still visible. */
export function morningNotes(state: GameState, world: World): string[] {
  return world.morning.notes.filter((n) => evaluateAll(state, world, n.when)).map((n) => renderText(n.text, state, world));
}

/** Profile to persist between nights. */
export function profileOf(state: GameState): Profile {
  return { v: STATE_VERSION, profile: { ...state.profile }, history: { nights: [...state.history.nights], pledges: [...state.history.pledges] } };
}
