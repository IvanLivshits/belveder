/** Every `{...}` in a storylet's text and lines, a choice's label, outcome and reply, a fragment, report note, notebook page,
 *  lead, rumor and evidence card must name a declared quality; `report.progress` may also use PROGRESS_PLACEHOLDERS. */
import { PROGRESS_PLACEHOLDERS, placeholders, qualityMatches, type Line } from "@belvedere/content-schema";
import { error, type Issue, type Rule } from "./types";

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  const declared = (id: string) => world.qualities.some((q) => qualityMatches(q.id, id));
  const checkText = (where: string, text: string | undefined, also: readonly string[] = []) => {
    for (const ph of placeholders(text ?? "")) {
      if (!declared(ph) && !also.includes(ph)) issues.push(error(where, `placeholder {${ph}} is not a declared quality`));
    }
  };
  const checkLines = (where: string, lines: readonly Line[] | undefined) => lines?.forEach((l, i) => checkText(`${where} #${i}`, l.text));
  for (const s of world.storylets) {
    checkText(`storylet ${s.id} text`, s.text);
    checkLines(`storylet ${s.id} line`, s.lines);
    s.choices.forEach((c, i) => {
      checkText(`storylet ${s.id} choice #${i} text`, c.say ?? c.do ?? c.text);
      checkText(`storylet ${s.id} choice #${i} outcome`, c.outcome);
      checkLines(`storylet ${s.id} choice #${i} reply`, c.reply);
    });
  }
  for (const f of world.fragments) checkText(`fragment ${f.id}`, f.text);
  world.report.notes.forEach((n, i) => checkText(`report note #${i}`, n.text));
  world.report.progress.forEach((n, i) => checkText(`report progress #${i}`, n.text, PROGRESS_PLACEHOLDERS));
  world.rumors.forEach((r) => checkText(`rumor ${r.id}`, r.text));
  world.notebook?.leads.forEach((l) => {
    checkText(`lead ${l.id} text`, l.text);
    checkText(`lead ${l.id} answer`, l.answer);
  });
  world.morning.notes.forEach((n, i) => checkText(`morning note #${i}`, n.text));
  world.endings?.endings.forEach((e) => {
    checkText(`ending ${e.id} text`, e.text);
    e.epilogues.forEach((ep, i) => checkText(`ending ${e.id} epilogue #${i}`, ep.text));
  });
  if (world.endings) for (const [k, v] of Object.entries(world.endings.story)) if (typeof v === "string") checkText(`endings story ${k}`, v);
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
