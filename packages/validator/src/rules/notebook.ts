/** Notebook pages have unique ids and unlock only on profile qualities (a run condition would
 *  close the page again next night); life templates may only use the pair label placeholders. */
import { LIFE_PLACEHOLDERS, parseCondition, placeholders, qualityMatches } from "@belvedere/content-schema";
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  const nb = world.notebook;
  if (!nb) return issues;
  const seen = new Set<string>();
  for (const page of nb.pages) {
    const where = `notebook page ${page.id}`;
    if (seen.has(page.id)) issues.push(error(where, "duplicate page id"));
    seen.add(page.id);
    for (const c of page.when) {
      const q = parseCondition(c).quality;
      const def = world.qualities.find((d) => qualityMatches(d.id, q));
      if (def && def.scope !== "profile") issues.push(error(where, `when uses run quality ${q}; pages may only unlock on profile qualities`));
    }
  }
  for (const [name, template] of Object.entries(nb.life.states)) {
    for (const ph of placeholders(template)) {
      if (!(LIFE_PLACEHOLDERS as readonly string[]).includes(ph)) issues.push(error(`notebook life.states.${name}`, `unknown placeholder {${ph}}; allowed: ${LIFE_PLACEHOLDERS.join(", ")}`));
    }
  }
  return issues;
};
