/** Each memory pair names two declared quality flags and its returnWhen uses declared qualities. */
import { parseCondition, qualityMatches } from "@belvedere/content-schema";
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  const declared = (id: string) => world.qualities.some((q) => qualityMatches(q.id, id));
  const seen = new Set<string>();
  world.memories.forEach((pair, i) => {
    const where = `memory pair #${i} (${pair.false})`;
    for (const flag of [pair.false, pair.true]) {
      if (!declared(flag)) issues.push(error(where, `flag is not a declared quality: ${flag}`));
      if (seen.has(flag)) issues.push(error(where, `flag used by more than one pair: ${flag}`));
      seen.add(flag);
    }
    if (pair.false === pair.true) issues.push(error(where, "false and true flags are the same quality"));
    for (const c of pair.returnWhen) {
      const q = parseCondition(c).quality;
      if (!declared(q)) issues.push(error(where, `returnWhen uses undeclared quality: ${q}`));
    }
  });
  return issues;
};
