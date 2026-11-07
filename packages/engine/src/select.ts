import type { Choice, Storylet, World } from "@belvedere/content-schema";
import { evaluateAll, type Bags } from "./conditions";
import { nextInt, type RngState } from "./rng";

/** Storylets eligible at a location, highest priority only; `accept` narrows the pool further. */
export function candidates(state: Bags, world: World, location: string, accept: (s: Storylet) => boolean = () => true): Storylet[] {
  const eligible = world.storylets.filter(
    (s) => s.location === location && accept(s) && evaluateAll(state, world, s.when),
  );
  if (eligible.length === 0) return [];
  const top = Math.max(...eligible.map((s) => s.priority));
  return eligible.filter((s) => s.priority === top);
}

/** Picks one candidate; ties are broken with the seeded RNG. */
export function selectStorylet(
  state: Bags,
  world: World,
  location: string,
  rng: RngState,
  accept?: (s: Storylet) => boolean,
): [storylet: Storylet | undefined, rng: RngState] {
  const pool = candidates(state, world, location, accept);
  if (pool.length <= 1) return [pool[0], rng];
  const [i, next] = nextInt(rng, pool.length);
  return [pool[i], next];
}

/** Every choice with its original index and whether its conditions hold. */
export function choicesOf(state: Bags, world: World, storylet: Storylet) {
  return storylet.choices.map((choice, index) => ({
    choice,
    index,
    available: evaluateAll(state, world, choice.when),
  }));
}

/** The doors of a `layout: doors` card: choices with the same goto are variants of one door.
 *  A door shows its first open variant, or the first one (locked) when none is open. */
export function doorsOf<T extends { choice: Choice; available: boolean }>(choices: readonly T[]): T[] {
  const doors = new Map<string | undefined, T>();
  for (const c of choices) {
    const shown = doors.get(c.choice.goto);
    if (shown === undefined || (!shown.available && c.available)) doors.set(c.choice.goto, c);
  }
  return [...doors.values()];
}
