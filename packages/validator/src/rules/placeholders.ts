/** Every `{...}` in storylet text, choice text, outcome and fragment text must name a declared quality. */
import { placeholders, qualityMatches } from "@belvedere/content-schema";
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  const declared = (id: string) => world.qualities.some((q) => qualityMatches(q.id, id));
  const checkText = (where: string, text: string | undefined) => {
    for (const ph of placeholders(text ?? "")) {
      if (!declared(ph)) issues.push(error(where, `placeholder {${ph}} is not a declared quality`));
    }
  };
  for (const s of world.storylets) {
    checkText(`storylet ${s.id} text`, s.text);
    s.choices.forEach((c, i) => {
      checkText(`storylet ${s.id} choice #${i} text`, c.text);
      checkText(`storylet ${s.id} choice #${i} outcome`, c.outcome);
    });
  }
  for (const f of world.fragments) checkText(`fragment ${f.id}`, f.text);
  return issues;
};
