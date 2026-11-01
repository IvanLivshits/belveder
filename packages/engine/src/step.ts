import type { World } from "@belvedere/content-schema";
import { evaluateAll } from "./conditions";
import { applyEffects } from "./effects";
import { resetRun } from "./qualities";
import { buildReport } from "./report";
import { seedRng } from "./rng";
import { selectStorylet, visibleChoices } from "./select";
import { EngineError, STATE_VERSION, findStorylet, type GameState, type Profile } from "./state";

export type Action = { type: "choose"; index: number } | { type: "newNight"; seed: number };

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

export function choose(state: GameState, world: World, index: number): GameState {
  if (state.phase !== "scene") throw new EngineError("cannot choose outside a scene");
  const storylet = findStorylet(world, state.storyletId);
  const visible = visibleChoices(state, world, storylet);
  if (!visible.some((v) => v.index === index)) throw new EngineError(`choice ${index} not available in ${storylet.id}`);
  const choice = storylet.choices[index]!;

  let next: GameState = { ...state, log: [...state.log, { storylet: storylet.id, choice: index }] };
  next = applyEffects(next, world, choice.effects);
  if (!choice.free) next = applyEffects(next, world, world.rules.onChoice);

  const ends = choice.endNight || (world.rules.nightEndWhen.length > 0 && evaluateAll(next, world, world.rules.nightEndWhen));
  if (ends) return endNight(next, world);
  return enterLocation(next, world, choice.goto ?? next.location);
}

export function step(state: GameState, world: World, action: Action): GameState {
  switch (action.type) {
    case "choose": return choose(state, world, action.index);
    case "newNight": return newNight(state, world, action.seed);
  }
}

/** What the renderer needs for the current scene. */
export function currentScene(state: GameState, world: World) {
  const storylet = findStorylet(world, state.storyletId);
  return { storylet, choices: visibleChoices(state, world, storylet) };
}

/** Report page data: slot -> fragment text, in slot order. */
export function currentReport(state: GameState, world: World) {
  return world.report.slots.map((slot) => {
    const id = state.report[slot];
    const fragment = world.fragments.find((f) => f.id === id);
    if (!fragment) throw new EngineError(`report slot ${slot} has no fragment in state`);
    return { slot, fragment };
  });
}

/** Profile to persist between nights. */
export function profileOf(state: GameState): Profile {
  return { v: STATE_VERSION, profile: { ...state.profile } };
}
