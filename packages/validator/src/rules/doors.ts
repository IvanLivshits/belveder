/** `layout: doors` = exactly three choices, each with goto. */
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  for (const s of world.storylets) {
    if (s.layout !== "doors") continue;
    if (s.choices.length !== 3) issues.push(error(`storylet ${s.id}`, `doors layout needs 3 choices, has ${s.choices.length}`));
    s.choices.forEach((c, i) => {
      if (!c.goto && !c.endNight) issues.push(error(`storylet ${s.id} choice #${i}`, "door choice needs goto"));
    });
  }
  return issues;
};
