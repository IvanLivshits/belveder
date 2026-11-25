import type { World } from "@belvedere/content-schema";
import { evaluateAll, type Bags } from "./conditions";

/** The music's tension level from `rules.tension`: the first rule whose conditions all hold, else 0. Presentation only:
 *  the app passes it to the sound engine as is. */
export function tensionLevel(state: Bags, world: World): number {
  return world.rules.tension?.find((rule) => evaluateAll(state, world, rule.when))?.level ?? 0;
}
