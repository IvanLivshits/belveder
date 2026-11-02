/** Every quality used in a condition/effect must be declared in world.qualities;
 *  rules.start must be a declared location. */
import { parseCondition, parseEffect, qualityMatches, type World } from "@belvedere/content-schema";
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  const declared = (id: string) => world.qualities.some((q) => qualityMatches(q.id, id));
  const checkConds = (where: string, conds: readonly string[]) => {
    for (const c of conds) {
      const q = parseCondition(c).quality;
      if (!declared(q)) issues.push(error(where, `condition uses undeclared quality: ${q}`));
    }
  };
  const checkEffects = (where: string, effects: readonly string[]) => {
    for (const e of effects) {
      const q = parseEffect(e).quality;
      if (!declared(q)) issues.push(error(where, `effect uses undeclared quality: ${q}`));
    }
  };

  checkEffects("rules.onChoice", world.rules.onChoice);
  world.rules.interrupts.forEach((i, n) => checkConds(`rules.interrupts #${n}`, i.when));
  checkEffects("rules.onNightEnd", world.rules.onNightEnd);
  if (!world.locations.some((l) => l.id === world.rules.start)) {
    issues.push(error("rules.start", `unknown location: ${world.rules.start}`));
  }
  for (const s of world.storylets) {
    checkConds(`storylet ${s.id}`, s.when);
    s.choices.forEach((c, i) => {
      checkConds(`storylet ${s.id} choice #${i}`, c.when);
      checkEffects(`storylet ${s.id} choice #${i}`, c.effects);
    });
  }
  for (const f of world.fragments) checkConds(`fragment ${f.id}`, f.when);
  world.report.notes.forEach((n, i) => checkConds(`report note #${i}`, n.when));
  world.morning.notes.forEach((n, i) => checkConds(`morning note #${i}`, n.when));
  world.notebook?.pages.forEach((p) => checkConds(`notebook page ${p.id}`, p.when));
  if (world.notebook) checkConds("notebook life.footer", world.notebook.life.footer.when);

  const seen = new Set<string>();
  for (const q of world.qualities) {
    if (seen.has(q.id)) issues.push(error("qualities", `duplicate quality: ${q.id}`));
    seen.add(q.id);
    if (q.min !== undefined && q.max !== undefined && q.min > q.max) issues.push(error(`quality ${q.id}`, "min > max"));
  }
  return issues;
};
