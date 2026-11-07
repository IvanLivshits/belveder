import { PLACEHOLDER_RE, qualityMatches, type World } from "@belvedere/content-schema";
import { getQuality } from "./qualities";
import type { Bags } from "./conditions";

/** Replaces `{quality_id}` with the current value and `{name}` from `extra` with the number given
 *  (values the engine counts itself). Unknown ids are left as written (the validator rejects them at build time). */
export function renderText(template: string, state: Bags, world: World, extra: Readonly<Record<string, number>> = {}): string {
  return template.replace(PLACEHOLDER_RE, (whole, id: string) => {
    if (id in extra) return String(extra[id]);
    return world.qualities.some((q) => qualityMatches(q.id, id)) ? String(getQuality(state, world, id)) : whole;
  });
}

/** Paragraphs are separated by blank lines in content. */
export function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
