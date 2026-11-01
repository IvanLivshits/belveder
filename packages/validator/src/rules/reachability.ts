/** Locations not reachable from rules.start through any goto (conditions ignored). */
import { warning, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  const edges = new Map<string, Set<string>>();
  for (const s of world.storylets) {
    const out = edges.get(s.location) ?? new Set<string>();
    for (const c of s.choices) if (c.goto) out.add(c.goto);
    edges.set(s.location, out);
  }
  const seen = new Set<string>([world.rules.start]);
  const queue = [world.rules.start];
  while (queue.length) {
    const cur = queue.pop()!;
    for (const next of edges.get(cur) ?? []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
  for (const loc of world.locations) {
    if (!seen.has(loc.id)) issues.push(warning(`location ${loc.id}`, "unreachable from rules.start by any goto"));
  }
  return issues;
};
