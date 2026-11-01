import { PLACEHOLDER_RE, qualityMatches, type World } from "@belvedere/content-schema";
import { getQuality } from "./qualities";
import type { GameState } from "./state";

type Bags = Pick<GameState, "run" | "profile">;

/** Replaces `{quality_id}` with the current value. Unknown ids are left as written
 *  (the validator rejects them at build time). */
export function renderText(template: string, state: Bags, world: World): string {
  return template.replace(PLACEHOLDER_RE, (whole, id: string) =>
    world.qualities.some((q) => qualityMatches(q.id, id)) ? String(getQuality(state, world, id)) : whole,
  );
}
