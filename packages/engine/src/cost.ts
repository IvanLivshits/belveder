import { parseEffect, type Choice, type World } from "@belvedere/content-schema";
import { getQuality } from "./qualities";
import type { Bags } from "./conditions";

/** The quality that `rules.onChoice` increments, i.e. what a move costs; null if there is none. */
export function clockQuality(world: World): string | null {
  for (const e of world.rules.onChoice) {
    const { quality, op } = parseEffect(e);
    if (op === "+=") return quality;
  }
  return null;
}

/** The quality that `rules.onNightEnd` increments, i.e. the night counter; null if there is none. */
export function nightQuality(world: World): string | null {
  for (const e of world.rules.onNightEnd) {
    const { quality, op } = parseEffect(e);
    if (op === "+=") return quality;
  }
  return null;
}

/** Nominal change of the clock quality a choice would cause: its own effects plus
 *  `rules.onChoice` unless the choice is free. Ignores min/max clamping on purpose:
 *  the label says what the choice asks for, not what the night has left. */
export function choiceCost(state: Bags, world: World, choice: Choice): number {
  const clock = clockQuality(world);
  if (clock === null) return 0;
  const effects = choice.free ? choice.effects : [...choice.effects, ...world.rules.onChoice];
  let value = getQuality(state, world, clock);
  const start = value;
  for (const e of effects) {
    const { quality, op, value: n } = parseEffect(e);
    if (quality !== clock) continue;
    value = op === "+=" ? value + n : op === "-=" ? value - n : n;
  }
  return value - start;
}
