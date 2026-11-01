import type { Storylet, World } from "@belvedere/content-schema";
import { evaluateAll } from "./conditions";
import { nextInt, type RngState } from "./rng";
import type { GameState } from "./state";

type Bags = Pick<GameState, "run" | "profile">;

/** Storylets eligible at a location, highest priority only. */
export function candidates(state: Bags, world: World, location: string): Storylet[] {
  const eligible = world.storylets.filter(
    (s) => s.location === location && evaluateAll(state, world, s.when),
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
): [storylet: Storylet | undefined, rng: RngState] {
  const pool = candidates(state, world, location);
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
