/** goto -> known location; storylet.location known; background/portrait -> assets.json; unique ids. */
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world, assets) => {
  const issues: Issue[] = [];
  const locations = new Set(world.locations.map((l) => l.id));
  const ids = new Set<string>();
  for (const s of world.storylets) {
    if (ids.has(s.id)) issues.push(error(`storylet ${s.id}`, "duplicate storylet id"));
    ids.add(s.id);
    if (!locations.has(s.location)) issues.push(error(`storylet ${s.id}`, `unknown location: ${s.location}`));
    if (!(s.background in assets)) issues.push(error(`storylet ${s.id}`, `unknown background asset: ${s.background}`));
    if (s.portrait && !(s.portrait in assets)) issues.push(error(`storylet ${s.id}`, `unknown portrait asset: ${s.portrait}`));
    s.choices.forEach((c, i) => {
      if (c.goto && !locations.has(c.goto)) issues.push(error(`storylet ${s.id} choice #${i}`, `goto unknown location: ${c.goto}`));
    });
  }
  world.rules.interrupts.forEach((i, n) => {
    if (!locations.has(i.goto)) issues.push(error(`rules.interrupts #${n}`, `goto unknown location: ${i.goto}`));
  });
  const fids = new Set<string>();
  const slots = new Set(world.report.slots.map((s) => s.id));
  for (const f of world.fragments) {
    if (fids.has(f.id)) issues.push(error(`fragment ${f.id}`, "duplicate fragment id"));
    fids.add(f.id);
    if (!slots.has(f.slot)) issues.push(error(`fragment ${f.id}`, `unknown report slot: ${f.slot}`));
  }
  return issues;
};
