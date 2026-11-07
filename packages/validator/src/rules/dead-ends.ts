/** A location without storylets is a hard dead end. A storylet whose every
 *  choice is conditional may show zero choices; the simulation proves otherwise.
 *  A stairs card has no choices of its own: its floors come from `world.stairs`;
 *  a pledge card always has the envelopes, and its night pledge comes in variants. */
import { error, warning, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  for (const loc of world.locations) {
    if (!world.storylets.some((s) => s.location === loc.id)) {
      issues.push(error(`location ${loc.id}`, "no storylets at this location"));
    }
  }
  for (const s of world.storylets) {
    if (s.layout !== "stairs" && s.layout !== "pledge" && !s.choices.some((c) => c.when.length === 0)) {
      issues.push(warning(`storylet ${s.id}`, "every choice is conditional; simulation must prove a choice is always open"));
    }
  }
  return issues;
};
