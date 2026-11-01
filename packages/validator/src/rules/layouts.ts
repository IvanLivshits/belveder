/** `layout: doors` = exactly three choices, each with goto or endNight.
 *  `layout: pledge` needs memory pairs in the world and at least one plain choice (the night pledge). */
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  for (const s of world.storylets) {
    if (s.layout === "doors") {
      if (s.choices.length !== 3) issues.push(error(`storylet ${s.id}`, `doors layout needs 3 choices, has ${s.choices.length}`));
      s.choices.forEach((c, i) => {
        if (!c.goto && !c.endNight) issues.push(error(`storylet ${s.id} choice #${i}`, "door choice needs goto"));
      });
    }
    if (s.layout === "pledge") {
      if (world.memories.length === 0) issues.push(error(`storylet ${s.id}`, "pledge layout but world.memories is empty"));
      if (!s.choices.some((c) => c.when.length === 0 && c.endNight)) {
        issues.push(error(`storylet ${s.id}`, "pledge layout needs an unconditional endNight choice (pledge the night)"));
      }
    }
  }
  return issues;
};
