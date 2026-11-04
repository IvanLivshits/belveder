import type { World } from "@belvedere/content-schema";
import { evaluateAll } from "./conditions";
import type { GameState } from "./state";

type Bags = Pick<GameState, "run" | "profile">;

/** True while `rules.tensionWhen` holds (AND). Presentation only: the app picks the music from it. False without the rule. */
export function isTense(state: Bags, world: World): boolean {
  const when = world.rules.tensionWhen;
  return when !== undefined && when.length > 0 && evaluateAll(state, world, when);
}
