/** The feed format. Errors: a line's `who` is not in `world.speakers`; a choice has none of `say`, `do`, `text`.
 *  Warnings (the authors' limits): narrator over 25 words, a character over 30, the inner voice over 15;
 *  more than 4 lines before the choices or 3 in a reply; `say`/`do` over 8 words; a card of lines with more than
 *  8 choices where at least one stays on the card (on screen the limit is 4 plus the exit; conditions must keep it there). */
import type { Line, World } from "@belvedere/content-schema";
import { error, warning, type Issue, type Rule } from "./types";

export const LIMITS = { narrator: 25, speech: 30, inner: 15, written: 30, lines: 4, reply: 3, choice: 8, choices: 8 } as const;

/** Words are runs with a letter or a digit in them: a lone dash does not count. */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

function checkLines(world: World, where: string, lines: readonly Line[], max: number, what: string): Issue[] {
  const issues: Issue[] = [];
  if (lines.length > max) issues.push(warning(where, `${lines.length} lines ${what} (limit ${max})`));
  lines.forEach((l, i) => {
    const speaker = world.speakers[l.who];
    if (!speaker) { issues.push(error(`${where} #${i}`, `unknown speaker: ${l.who}`)); return; }
    const style = speaker.style ?? "speech";
    const words = wordCount(l.text ?? "");
    if (words > LIMITS[style]) issues.push(warning(`${where} #${i}`, `${style === "speech" || style === "written" ? "a character's" : `the ${style}'s`} line is ${words} words long (limit ${LIMITS[style]})`));
  });
  return issues;
}

export const check: Rule = (world) => {
  const issues: Issue[] = [];
  for (const s of world.storylets) {
    if (s.lines) issues.push(...checkLines(world, `storylet ${s.id} line`, s.lines, LIMITS.lines, "before the choices"));
    s.choices.forEach((c, i) => {
      const where = `storylet ${s.id} choice #${i}`;
      const label = c.say ?? c.do;
      if (label === undefined && c.text === undefined) issues.push(error(where, "a choice needs one of say, do, text"));
      if (label !== undefined && wordCount(label) > LIMITS.choice) issues.push(warning(where, `${c.say !== undefined ? "say" : "do"} is ${wordCount(label)} words long (limit ${LIMITS.choice})`));
      if (c.reply) issues.push(...checkLines(world, `${where} reply`, c.reply, LIMITS.reply, "in a reply"));
    });
    // A card where every choice leads elsewhere is a menu (doors, the lift panel), not a conversation.
    const stays = s.choices.some((c) => c.goto === undefined && !c.endNight && c.ending === undefined);
    if (s.lines && stays && s.choices.length > LIMITS.choices) {
      issues.push(warning(`storylet ${s.id}`, `many choices: ${s.choices.length} (limit ${LIMITS.choices}; on screen at most 4 plus the exit, so conditions must hide the rest)`));
    }
  }
  return issues;
};
