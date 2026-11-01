import { qualityMatches, type QualityDef, type World } from "@belvedere/content-schema";
import { EngineError, type GameState, type Qualities } from "./state";

export function qualityDef(world: World, id: string): QualityDef {
  const def = world.qualities.find((q) => qualityMatches(q.id, id));
  if (!def) throw new EngineError(`undeclared quality: ${id}`);
  return def;
}

export function getQuality(state: Pick<GameState, "run" | "profile">, world: World, id: string): number {
  const def = qualityDef(world, id);
  const bag = def.scope === "run" ? state.run : state.profile;
  return bag[id] ?? def.default;
}

function clamp(def: QualityDef, value: number): number {
  if (def.min !== undefined && value < def.min) return def.min;
  if (def.max !== undefined && value > def.max) return def.max;
  return value;
}

/** Returns new run/profile bags with the quality set; values equal to default are dropped. */
export function setQuality<S extends Pick<GameState, "run" | "profile">>(state: S, world: World, id: string, value: number): S {
  const def = qualityDef(world, id);
  const clamped = clamp(def, value);
  const key = def.scope;
  const bag: Qualities = { ...state[key] };
  if (clamped === def.default) delete bag[id];
  else bag[id] = clamped;
  return { ...state, [key]: bag };
}

/** Fresh run bag: every run quality at its default (i.e. empty). */
export function resetRun<S extends Pick<GameState, "run">>(state: S): S {
  return { ...state, run: {} };
}
