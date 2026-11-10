/** Every quality used in a condition/effect must be declared in world.qualities: storylets and their lines,
 *  rules, report, notebook (pages, leads, vouchers), rumors, stairs, endings. rules.start must be a declared location. */
import { parseCondition, parseEffect, qualityMatches } from "@belvedere/content-schema";
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
  checkEffects("rules.onNightStart", world.rules.onNightStart);
  world.rules.migrations.forEach((m, n) => { checkConds(`rules.migrations #${n}`, m.when); checkEffects(`rules.migrations #${n}`, m.effects); });
  world.rules.interrupts.forEach((i, n) => checkConds(`rules.interrupts #${n}`, i.when));
  checkEffects("rules.onNightEnd", world.rules.onNightEnd);
  if (world.rules.clock && !declared(world.rules.clock.quality)) issues.push(error("rules.clock", `undeclared quality: ${world.rules.clock.quality}`));
  if (world.rules.pledgedNightWhen) checkConds("rules.pledgedNightWhen", world.rules.pledgedNightWhen);
  if (world.rules.tensionWhen) checkConds("rules.tensionWhen", world.rules.tensionWhen);
  world.endings?.endings.forEach((e) => e.epilogues.forEach((ep, i) => checkConds(`ending ${e.id} epilogue #${i}`, ep.when)));
  if (!world.locations.some((l) => l.id === world.rules.start)) {
    issues.push(error("rules.start", `unknown location: ${world.rules.start}`));
  }
  for (const s of world.storylets) {
    checkConds(`storylet ${s.id}`, s.when);
    s.lines?.forEach((l, i) => checkConds(`storylet ${s.id} line #${i}`, l.when));
    s.choices.forEach((c, i) => {
      checkConds(`storylet ${s.id} choice #${i}`, c.when);
      checkEffects(`storylet ${s.id} choice #${i}`, c.effects);
      c.reply?.forEach((l, j) => checkConds(`storylet ${s.id} choice #${i} reply #${j}`, l.when));
    });
  }
  for (const f of world.fragments) checkConds(`fragment ${f.id}`, f.when);
  world.report.notes.forEach((n, i) => checkConds(`report note #${i}`, n.when));
  world.report.progress.forEach((n, i) => checkConds(`report progress #${i}`, n.when));
  world.rumors.forEach((r) => checkConds(`rumor ${r.id}`, r.when));
  world.notebook?.leads.forEach((l) => { checkConds(`lead ${l.id}`, l.when); checkConds(`lead ${l.id} done`, l.done); });
  const vouchers = world.notebook?.vouchers;
  if (vouchers) {
    checkConds("notebook vouchers", vouchers.when);
    for (const q of Object.keys(vouchers.names)) if (!declared(q)) issues.push(error("notebook vouchers.names", `undeclared quality: ${q}`));
  }
  const stairs = world.stairs;
  if (stairs) {
    if (!declared(stairs.quality)) issues.push(error("stairs.quality", `undeclared quality: ${stairs.quality}`));
    stairs.costMods.forEach((m, i) => checkConds(`stairs.costMods #${i}`, m.when));
    stairs.locks.forEach((l, i) => l.open_any.forEach((group) => checkConds(`stairs.locks #${i}`, group)));
    checkEffects("stairs.onTravel", stairs.onTravel);
  }
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
