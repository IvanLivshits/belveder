/** Rumors: unique ids, the run flag `rumor.<id>` the engine sets is declared, `rules.firstNightRumor` names a rumor. */
import { RESERVED_QUALITIES, qualityMatches } from "@belvedere/content-schema";
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  const declared = (id: string) => world.qualities.some((q) => qualityMatches(q.id, id));
  const seen = new Set<string>();
  for (const r of world.rumors) {
    const where = `rumor ${r.id}`;
    if (seen.has(r.id)) issues.push(error(where, "duplicate rumor id"));
    seen.add(r.id);
    const key = RESERVED_QUALITIES.rumorPrefix + r.id;
    if (!declared(key)) issues.push(error(where, `engine writes ${key} when the night starts but it is not declared`));
  }
  const first = world.rules.firstNightRumor;
  if (first !== undefined && !seen.has(first)) issues.push(error("rules.firstNightRumor", `unknown rumor: ${first}`));
  return issues;
};
