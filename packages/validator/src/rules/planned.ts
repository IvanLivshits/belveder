/** A condition on a quality that nothing sets (no effect, no rule, not written by the engine,
 *  default 0) can never be true. Usually content for later floors: warning "planned". */
import { RESERVED_QUALITIES, parseCondition, parseEffect, qualityMatches, type World } from "@belvedere/content-schema";
import { warning, type Issue, type Rule } from "./types";

function writtenQualities(world: World): Set<string> {
  const out = new Set<string>();
  const add = (effects: readonly string[]) => effects.forEach((e) => out.add(parseEffect(e).quality));
  add(world.rules.onChoice);
  add(world.rules.onNightEnd);
  for (const s of world.storylets) for (const c of s.choices) add(c.effects);
  const { pledgedPrefix, returnedPrefix, memoriesReturned, foundPrefix, endingPrefix } = RESERVED_QUALITIES;
  for (const item of world.evidence.items) out.add(foundPrefix + item.id);
  for (const e of world.endings?.endings ?? []) out.add(endingPrefix + e.id);
  for (const m of world.memories) {
    out.add(m.fake); out.add(m.real);
    out.add(pledgedPrefix + m.id); out.add(returnedPrefix + m.id);
    out.add(memoriesReturned);
  }
  return out;
}

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  const written = writtenQualities(world);
  const hasNonZeroDefault = (id: string) => (world.qualities.find((q) => qualityMatches(q.id, id))?.default ?? 0) !== 0;
  const reported = new Set<string>();
  const checkConds = (where: string, conds: readonly string[]) => {
    for (const c of conds) {
      const q = parseCondition(c).quality;
      if (written.has(q) || hasNonZeroDefault(q) || reported.has(q)) continue;
      reported.add(q);
      issues.push(warning(where, `planned: ${q} is never set by any effect, so this condition cannot change`));
    }
  };
  for (const s of world.storylets) {
    checkConds(`storylet ${s.id}`, s.when);
    s.choices.forEach((c, i) => checkConds(`storylet ${s.id} choice #${i}`, c.when));
  }
  for (const f of world.fragments) checkConds(`fragment ${f.id}`, f.when);
  world.memories.forEach((m) => checkConds(`memory pair ${m.id}`, m.returnWhen));
  world.rules.interrupts.forEach((i, n) => checkConds(`rules.interrupts #${n}`, i.when));
  return issues;
};
