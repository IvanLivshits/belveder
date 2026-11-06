/** `layout: doors` = exactly three doors, each choice with goto or endNight (choices with the same goto are variants of one door).
 *  `layout: pledge` needs memory pairs in the world and at least one plain choice (the night pledge).
 *  `layout: stairs` needs `world.stairs` and lives at `stairs.location`; `floors` belongs to encounters at `stairs.events` only. */
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  for (const s of world.storylets) {
    if (s.layout === "doors") {
      const doors = new Set(s.choices.map((c) => c.goto)).size;
      if (doors !== 3) issues.push(error(`storylet ${s.id}`, `doors layout needs 3 doors (distinct goto), has ${doors}`));
      s.choices.forEach((c, i) => {
        if (!c.goto && !c.endNight) issues.push(error(`storylet ${s.id} choice #${i}`, "door choice needs goto"));
      });
    }
    if (s.layout === "stairs") {
      if (!world.stairs) issues.push(error(`storylet ${s.id}`, "stairs layout but the world has no stairs"));
      else if (s.location !== world.stairs.location) issues.push(error(`storylet ${s.id}`, `stairs layout outside stairs.location (${world.stairs.location})`));
    }
    if (s.floors !== undefined && s.location !== world.stairs?.events) {
      issues.push(error(`storylet ${s.id}`, "floors is only for encounters on the stairs (location stairs.events)"));
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
