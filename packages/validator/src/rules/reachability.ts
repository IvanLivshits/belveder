/** Locations not reachable from rules.start through any goto (conditions ignored). The stairs screen
 *  leads to every landing and to its encounters, and an encounter leads on to any landing. */
import { warning, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  const edges = new Map<string, Set<string>>();
  for (const s of world.storylets) {
    const out = edges.get(s.location) ?? new Set<string>();
    for (const c of s.choices) if (c.goto) out.add(c.goto);
    edges.set(s.location, out);
  }
  const stairs = world.stairs;
  if (stairs) {
    const landings = Object.values(stairs.floors);
    for (const from of [stairs.location, ...(stairs.events !== undefined ? [stairs.events] : [])]) {
      const out = edges.get(from) ?? new Set<string>();
      for (const to of landings) out.add(to);
      if (stairs.events !== undefined && from === stairs.location) out.add(stairs.events);
      edges.set(from, out);
    }
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
