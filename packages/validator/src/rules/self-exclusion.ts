/** A choice without goto/endNight stays on the same location, so the storylet is re-selected.
 *  If that choice's effects break the storylet's own `when` while sibling choices do not, the card
 *  silently disappears and another one takes over mid-scene (seen as "the scene restarts") and the
 *  sibling questions are lost. Flags that retire a card belong on the choice that leaves, or on
 *  every staying choice (one-shot card). `intro: true` exempts a card explicitly. */
import { parseCondition, parseEffect, type Choice, type Storylet } from "@belvedere/content-schema";
import { warning, type Issue, type Rule } from "./types";

/** Does applying the effect to a state that satisfies the condition necessarily break it? */
function breaks(condition: string, effect: string): boolean {
  const c = parseCondition(condition);
  const e = parseEffect(effect);
  if (c.quality !== e.quality) return false;
  if (e.op === "=") {
    switch (c.op) {
      case "==": return e.value !== c.value;
      case "!=": return e.value === c.value;
      case "<": return !(e.value < c.value);
      case "<=": return !(e.value <= c.value);
      case ">": return !(e.value > c.value);
      case ">=": return !(e.value >= c.value);
    }
  }
  // += / -= : only an equality is certainly broken; bounds depend on the unknown current value.
  return c.op === "==" && e.value !== 0;
}

function staysOnCard(choice: Choice): boolean {
  return choice.goto === undefined && !choice.endNight;
}

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  for (const s of world.storylets as Storylet[]) {
    if (s.intro || s.when.length === 0) continue;
    const staying = s.choices.map((c, i) => ({ c, i })).filter(({ c }) => staysOnCard(c));
    const breaking = staying.filter(({ c }) => c.effects.some((e) => s.when.some((w) => breaks(w, e))));
    // Every staying choice retiring the card is the one-shot idiom (card, then the hub); only a mix is a bug:
    // after the retiring choice the other questions of the same card vanish mid-scene.
    if (breaking.length === 0 || breaking.length === staying.length) continue;
    for (const { c, i } of breaking) {
      const effect = c.effects.find((e) => s.when.some((w) => breaks(w, e)))!;
      issues.push(warning(`storylet ${s.id} choice #${i}`, `effect "${effect}" retires the card without leaving it, while other choices stay: the remaining choices vanish mid-scene (move the flag to the exiting choice or mark the card intro: true)`));
    }
  }
  return issues;
};
