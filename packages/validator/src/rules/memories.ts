/** Each memory pair has a unique id, two declared and distinct quality flags, returnWhen on
 *  declared qualities; a world with memories declares the qualities the engine writes on a pledge. */
import { RESERVED_QUALITIES, parseCondition, qualityMatches } from "@belvedere/content-schema";
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  const declared = (id: string) => world.qualities.some((q) => qualityMatches(q.id, id));
  const seenFlags = new Set<string>();
  const seenIds = new Set<string>();
  world.memories.forEach((pair, i) => {
    const where = `memory pair #${i} (${pair.id})`;
    if (seenIds.has(pair.id)) issues.push(error(where, "duplicate pair id"));
    seenIds.add(pair.id);
    for (const flag of [pair.fake, pair.real]) {
      if (!declared(flag)) issues.push(error(where, `flag is not a declared quality: ${flag}`));
      if (seenFlags.has(flag)) issues.push(error(where, `flag used by more than one pair: ${flag}`));
      seenFlags.add(flag);
    }
    if (pair.fake === pair.real) issues.push(error(where, "fake and real flags are the same quality"));
    for (const c of pair.returnWhen) {
      const q = parseCondition(c).quality;
      if (!declared(q)) issues.push(error(where, `returnWhen uses undeclared quality: ${q}`));
    }
    const { pledgedPrefix, returnedPrefix } = RESERVED_QUALITIES;
    for (const q of [pledgedPrefix + pair.id, returnedPrefix + pair.id]) {
      if (!declared(q)) issues.push(error(where, `engine writes ${q} on pledge but it is not declared`));
    }
  });
  if (world.memories.length > 0 && !declared(RESERVED_QUALITIES.memoriesReturned)) {
    issues.push(error("memories", `engine writes ${RESERVED_QUALITIES.memoriesReturned} but it is not declared`));
  }
  return issues;
};
