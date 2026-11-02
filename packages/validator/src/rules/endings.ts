/** Endings: every `choice.ending` names an ending from endings.yaml, ending ids are unique,
 *  images exist in assets.json, and the `endings.*` flags the engine writes are declared. */
import { RESERVED_QUALITIES, qualityMatches } from "@belvedere/content-schema";
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world, assets) => {
  const issues: Issue[] = [];
  const declared = (id: string) => world.qualities.some((q) => qualityMatches(q.id, id));
  const ids = new Set<string>();
  for (const e of world.endings?.endings ?? []) {
    const where = `ending ${e.id}`;
    if (ids.has(e.id)) issues.push(error(where, "duplicate ending id"));
    ids.add(e.id);
    if (!(e.image in assets)) issues.push(error(where, `unknown image asset: ${e.image}`));
    if (!declared(RESERVED_QUALITIES.endingPrefix + e.id)) issues.push(error(where, `engine writes ${RESERVED_QUALITIES.endingPrefix}${e.id} but it is not declared`));
  }
  for (const s of world.storylets) {
    s.choices.forEach((c, i) => {
      if (c.ending === undefined) return;
      const where = `storylet ${s.id} choice #${i}`;
      if (!ids.has(c.ending)) issues.push(error(where, `unknown ending: ${c.ending}`));
      if (c.endNight) issues.push(error(where, "ending and endNight on the same choice"));
    });
  }
  const story = world.endings?.story;
  if (story) {
    const slots = new Set(world.report.slots.map((s) => s.id));
    for (const slot of [story.opening_slot, story.litany_slot]) {
      if (slot !== undefined && !slots.has(slot)) issues.push(error("endings story", `unknown report slot: ${slot}`));
    }
  }
  return issues;
};
