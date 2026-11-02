/** Evidence folder: unique ids, `flag` is a declared quality, `image` exists in assets.json,
 *  and the `found.*` profile flags the engine writes are declared. */
import { RESERVED_QUALITIES, qualityMatches } from "@belvedere/content-schema";
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world, assets) => {
  const issues: Issue[] = [];
  const declared = (id: string) => world.qualities.some((q) => qualityMatches(q.id, id));
  const seen = new Set<string>();
  for (const item of world.evidence.items) {
    const where = `evidence ${item.id}`;
    if (seen.has(item.id)) issues.push(error(where, "duplicate evidence id"));
    seen.add(item.id);
    if (!declared(item.flag)) issues.push(error(where, `flag is not a declared quality: ${item.flag}`));
    if (item.image && !(item.image in assets)) issues.push(error(where, `unknown image asset: ${item.image}`));
    const key = RESERVED_QUALITIES.foundPrefix + item.id;
    if (!declared(key)) issues.push(error(where, `engine writes ${key} on discovery but it is not declared`));
  }
  return issues;
};
