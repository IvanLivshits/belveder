/** Every report slot needs an unconditional fallback fragment. */
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  for (const slot of world.report.slots) {
    const any = world.fragments.filter((f) => f.slot === slot);
    if (any.length === 0) issues.push(error(`report slot ${slot}`, "no fragments"));
    else if (!any.some((f) => f.when.length === 0)) issues.push(error(`report slot ${slot}`, "no unconditional fallback fragment"));
  }
  return issues;
};
