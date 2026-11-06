import type { World } from "@belvedere/content-schema";
import { evaluateAll, type Bags } from "./conditions";

/** True while `rules.tensionWhen` holds (AND; the schema forbids an empty list). Presentation only: the app picks the music from it. False without the rule. */
export function isTense(state: Bags, world: World): boolean {
  const when = world.rules.tensionWhen;
  return when !== undefined && evaluateAll(state, world, when);
}
