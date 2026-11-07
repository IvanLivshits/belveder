import { RESERVED_QUALITIES, placeholders, qualityMatches, type World } from "@belvedere/content-schema";
import { evaluateAll } from "./conditions";
import { clockQuality, nightQuality } from "./cost";
import { applyEffects } from "./effects";
import { recordEvidence } from "./evidence";
import { leadTargets, leadsView, recordVouchers } from "./leads";
import { choiceLabel, replyLines, sceneLines } from "./lines";
import { buildReport } from "./report";
import { seedRng } from "./rng";
import { currentRumor, drawRumor } from "./rumors";
import { choicesOf, doorsOf, selectStorylet } from "./select";
import { onPath, stairsView } from "./stairs";
import { EngineError, STATE_VERSION, copyHistory, findStorylet, type GameState, type NightRecord, type Profile } from "./state";
import { renderText } from "./text";
import { getQuality, setQuality } from "./qualities";

export type Action =
  | { type: "choose"; index: number }
  | { type: "continue" }
  | { type: "pledge"; pair: string }
  | { type: "travel"; floor: number }
  | { type: "newNight"; seed: number };

/** Bookkeeping after every batch of effects: evidence found, vouchers earned. */
function record(state: GameState, world: World): GameState {
  return recordVouchers(recordEvidence(state, world), world);
}

function enterLocation(state: GameState, world: World, location: string): GameState {
  const [storylet, rng] = selectStorylet(state, world, location, state.rng);
  if (!storylet) throw new EngineError(`no storylet available at location: ${location}`);
  return { ...state, rng, location, storyletId: storylet.id };
}

/** Starts a night from a saved profile (or a finished night's state): `rules.migrations` that match the
 *  profile as it arrived, then `rules.onNightStart`, then the night's rumor, then the first scene. */
export function newNight(profile: Profile, world: World, seed: number): GameState {
  let s: GameState = {
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
    history: copyHistory(profile.history),
    ending: null,
  };
  const due = world.rules.migrations.filter((m) => evaluateAll(s, world, m.when));
  for (const m of due) s = applyEffects(s, world, m.effects);
  s = applyEffects(s, world, world.rules.onNightStart);
  s = drawRumor(s, world);
  return enterLocation(record(s, world), world, world.rules.start);
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
  const counter = nightQuality(world);
  const night = counter === null ? state.history.nights.length + 1 : getQuality(state, world, counter) + 1;
  const rumor = currentRumor(state, world)?.id;
  const night_: NightRecord = { night, pledged, ...(pair !== undefined ? { pair } : {}), report, values, ...(rumor !== undefined ? { rumor } : {}) };
  const withEnd = applyEffects({ ...state, rng }, world, world.rules.onNightEnd);
  return { ...withEnd, phase: "report", report, history: { ...state.history, nights: [...state.history.nights, night_] } };
}

/** An ending choice: `endings.<id> = 1` and run `ending_night = 1`, then the night closes like any other (report, onNightEnd,
 *  history) and the phase becomes "ending". The profile keeps everything until `newCase`. */
function finishGame(state: GameState, world: World, ending: string): GameState {
  let flagged = setQuality(state, world, RESERVED_QUALITIES.endingPrefix + ending, 1);
  flagged = setQuality(flagged, world, RESERVED_QUALITIES.endingNight, 1); // the report may tell this night apart
  return { ...endNight(flagged, world), phase: "ending", ending };
}

/** Applies a choice's effects and resolves the move. A choice with a reply (or an old outcome text) that
 *  takes the player elsewhere or ends the night pauses in phase "outcome" until continueOutcome(), so the
 *  reply can be read where it was said; a reply that stays in place just goes on in the same feed. */
export function choose(state: GameState, world: World, index: number): GameState {
  if (state.phase !== "scene") throw new EngineError("cannot choose outside a scene");
  const storylet = findStorylet(world, state.storyletId);
  const entry = choicesOf(state, world, storylet)[index];
  if (!entry?.available) throw new EngineError(`choice ${index} not available in ${storylet.id}`);
  const choice = storylet.choices[index]!;

  let next: GameState = { ...state, log: [...state.log, { storylet: storylet.id, choice: index }] };
  next = applyEffects(next, world, choice.effects);
  if (!choice.free) next = applyEffects(next, world, world.rules.onChoice);
  // A choice that closes the night from a pledge screen is a pledge too (the night itself): the screen's pledgeEffects apply.
  if (choice.endNight || choice.ending !== undefined) next = applyEffects(next, world, storylet.pledgeEffects);
  next = record(next, world);

  const resolved = resolveChoice(next, world, index);
  if (choice.outcome === undefined && choice.reply === undefined) return resolved;
  if (resolved.phase === "scene" && resolved.location === next.location) return resolved;
  return { ...next, phase: "outcome", pendingChoice: index };
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
  return enterLocation(state, world, interrupt?.goto ?? choice.goto ?? onward(state, world));
}

/** Where a choice without goto leaves the player: in place, or, after an encounter on the stairs,
 *  on the landing the walk was heading to (`travel` has already set the floor). */
function onward(state: GameState, world: World): string {
  const st = world.stairs;
  if (st === undefined || st.events !== state.location) return state.location;
  return st.floors[String(getQuality(state, world, st.quality))] ?? state.location;
}

/** A walk on the stairs screen. To the current floor: back to its landing, free. To another one: the floor
 *  quality is set, the clock moves by the price of the walk (instead of `rules.onChoice`), `stairs.onTravel`
 *  applies; then interrupts; then at most one encounter from `stairs.events` whose `floors` lie on the way
 *  (highest priority); otherwise the landing. */
export function travel(state: GameState, world: World, floor: number): GameState {
  if (state.phase !== "scene") throw new EngineError("cannot walk outside a scene");
  const storylet = findStorylet(world, state.storyletId);
  const st = world.stairs;
  const view = storylet.layout === "stairs" ? stairsView(state, world) : null;
  if (!st || !view) throw new EngineError(`storylet ${storylet.id} is not a stairs screen`);
  let next: GameState = { ...state, log: [...state.log, { storylet: storylet.id, choice: -1, floor }] };
  const interrupted = (s: GameState) => world.rules.interrupts.find((i) => evaluateAll(s, world, i.when))?.goto;

  if (view.back?.floor === floor) return enterLocation(next, world, interrupted(next) ?? view.back.location);
  const dest = view.floors.find((f) => f.floor === floor);
  if (!dest) throw new EngineError(`no floor ${floor} on the stairs`);
  if (dest.locked !== null) throw new EngineError(`floor ${floor} is locked`);

  next = setQuality(next, world, st.quality, floor);
  const clock = clockQuality(world);
  if (clock !== null) next = setQuality(next, world, clock, getQuality(next, world, clock) + dest.cost);
  next = record(applyEffects(next, world, st.onTravel), world);

  const goto = interrupted(next);
  if (goto !== undefined) return enterLocation(next, world, goto);
  if (st.events !== undefined) {
    const [event, rng] = selectStorylet(next, world, st.events, next.rng, (s) => onPath(s, view.current, floor));
    if (event) return { ...next, rng, location: st.events, storyletId: event.id };
  }
  return enterLocation(next, world, dest.location);
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
    history: { ...state.history, pledges: [...state.history.pledges, pairId] },
  };
  next = setQuality(next, world, pair.fake, 0);
  next = setQuality(next, world, pledgedPrefix + pair.id, 1);
  if (evaluateAll(next, world, pair.returnWhen)) {
    next = setQuality(next, world, pair.real, 1);
    next = setQuality(next, world, returnedPrefix + pair.id, 1);
    next = setQuality(next, world, returnedTonight, 1);
    next = setQuality(next, world, memoriesReturned, getQuality(next, world, memoriesReturned) + 1);
  }
  // The screen's own price (e.g. trust lost for a shameful exit) comes after the pair, before the report.
  next = applyEffects(next, world, storylet.pledgeEffects);
  return endNight(next, world, pairId);
}

export function step(state: GameState, world: World, action: Action): GameState {
  switch (action.type) {
    case "choose": return choose(state, world, action.index);
    case "continue": return continueOutcome(state, world);
    case "pledge": return pledge(state, world, action.pair);
    case "travel": return travel(state, world, action.floor);
    case "newNight": return newNight(state, world, action.seed);
  }
}

/** What the renderer needs for the current scene: the card's lines, every choice with its label
 *  (`mode`: say / do / plain), availability and paperclip (an open lead points where it goes), the three
 *  doors of a doors layout, pawnable memories of a pledge layout and the floors of a stairs layout. */
export function currentScene(state: GameState, world: World) {
  const storylet = findStorylet(world, state.storyletId);
  const targets = leadTargets(state, world);
  const choices = choicesOf(state, world, storylet).map((c) => {
    const label = choiceLabel(c.choice);
    return { ...c, mode: label.mode, text: renderText(label.text, state, world), lead: c.choice.goto !== undefined && targets.has(c.choice.goto) };
  });
  return {
    storylet,
    lines: sceneLines(state, world, storylet),
    choices,
    doors: storylet.layout === "doors" ? doorsOf(choices) : [],
    memories: storylet.layout === "pledge" ? pledgeOptions(state, world) : [],
    stairs: storylet.layout === "stairs" ? stairsView(state, world) : null,
  };
}
export type SceneView = ReturnType<typeof currentScene>;

/** The reply still on screen (phase === "outcome"): the lines after the pending choice. */
export function currentOutcome(state: GameState, world: World) {
  if (state.phase !== "outcome" || state.pendingChoice === null) throw new EngineError("no outcome on screen");
  const storylet = findStorylet(world, state.storyletId);
  const choice = storylet.choices[state.pendingChoice]!;
  return { storylet, lines: replyLines(state, world, choice) };
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

/** Case progress under the report: `report.progress` lines whose conditions hold. Besides qualities the
 *  texts may use `{leads_done}` and `{leads_total}` (PROGRESS_PLACEHOLDERS), counted from the notebook's leads. */
export function progressNotes(state: GameState, world: World): string[] {
  const leads = leadsView(state, world);
  const extra = { leads_done: leads.done, leads_total: leads.total };
  return world.report.progress.filter((n) => evaluateAll(state, world, n.when)).map((n) => renderText(n.text, state, world, extra));
}

/** Profile to persist between nights. */
export function profileOf(state: GameState): Profile {
  return { v: STATE_VERSION, profile: { ...state.profile }, history: copyHistory(state.history) };
}

/** Can a saved run be continued on this world? Not when its card (or pending choice) is gone after a content update. */
export function isResumable(state: GameState, world: World): boolean {
  const storylet = world.storylets.find((s) => s.id === state.storyletId);
  return storylet !== undefined && (state.pendingChoice === null || storylet.choices[state.pendingChoice] !== undefined);
}
