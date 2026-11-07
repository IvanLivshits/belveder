/** Notebook pages (and the life footer) have unique ids and unlock only on profile qualities
 *  (a run condition would close them again next night); so do leads (`when`, `done`) and the vouchers page
 *  (`when`, `names`). Life templates may only use the pair label placeholders. */
import { LIFE_PLACEHOLDERS, parseCondition, placeholders, qualityMatches } from "@belvedere/content-schema";
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  const nb = world.notebook;
  if (!nb) return issues;
  const profileOnly = (where: string, when: readonly string[], what: string) => {
    for (const c of when) {
      const q = parseCondition(c).quality;
      const def = world.qualities.find((d) => qualityMatches(d.id, q));
      if (def && def.scope !== "profile") issues.push(error(where, `when uses run quality ${q}; ${what} may only unlock on profile qualities`));
    }
  };
  const seen = new Set<string>();
  for (const page of nb.pages) {
    const where = `notebook page ${page.id}`;
    if (seen.has(page.id)) issues.push(error(where, "duplicate page id"));
    seen.add(page.id);
    profileOnly(where, page.when, "pages");
  }
  profileOnly("notebook life.footer", nb.life.footer.when, "the footer");
  const leads = new Set<string>();
  for (const lead of nb.leads) {
    const where = `lead ${lead.id}`;
    if (leads.has(lead.id)) issues.push(error(where, "duplicate lead id"));
    leads.add(lead.id);
    profileOnly(where, lead.when, "leads");
    profileOnly(where, lead.done, "leads");
  }
  if (nb.vouchers) {
    profileOnly("notebook vouchers", nb.vouchers.when, "the vouchers page");
    profileOnly("notebook vouchers.names", Object.keys(nb.vouchers.names).map((q) => `${q} == 1`), "voucher names");
  }
  for (const [name, template] of Object.entries(nb.life.states)) {
    for (const ph of placeholders(template)) {
      if (!(LIFE_PLACEHOLDERS as readonly string[]).includes(ph)) issues.push(error(`notebook life.states.${name}`, `unknown placeholder {${ph}}; allowed: ${LIFE_PLACEHOLDERS.join(", ")}`));
    }
  }
  return issues;
};
