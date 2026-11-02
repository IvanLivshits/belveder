/** Every `{...}` in storylet text, choice text, outcome, fragment, report note, notebook page and evidence card must name a declared quality. */
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
  world.report.notes.forEach((n, i) => checkText(`report note #${i}`, n.text));
  world.morning.notes.forEach((n, i) => checkText(`morning note #${i}`, n.text));
  world.evidence.items.forEach((e) => {
    checkText(`evidence ${e.id} title`, e.title);
    checkText(`evidence ${e.id} text`, e.text);
  });
  world.notebook?.pages.forEach((p) => {
    checkText(`notebook page ${p.id} text`, p.text);
    checkText(`notebook page ${p.id} rule`, p.rule);
  });
  return issues;
};
