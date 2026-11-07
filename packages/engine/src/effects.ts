import { parseEffect, type World } from "@belvedere/content-schema";
import { getQuality, setQuality } from "./qualities";
import type { Bags } from "./conditions";

export function applyEffect<S extends Bags>(state: S, world: World, effect: string): S {
  const { quality, op, value } = parseEffect(effect);
  const current = getQuality(state, world, quality);
  const next = op === "+=" ? current + value : op === "-=" ? current - value : value;
  return setQuality(state, world, quality, next);
}

export function applyEffects<S extends Bags>(state: S, world: World, effects: readonly string[]): S {
  return effects.reduce((s, e) => applyEffect(s, world, e), state);
}
