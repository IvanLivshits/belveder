import type { Choice, Line, Storylet, World } from "@belvedere/content-schema";
import { evaluateAll } from "./conditions";
import { currentRumor } from "./rumors";
import { findStorylet, type GameState, type LogEntry } from "./state";
import { paragraphs, renderText } from "./text";

type Bags = Pick<GameState, "run" | "profile">;

/** narrator: no label, muted. inner: the inner voice, italic. speech: a character, label in its colour. */
export type LineStyle = "narrator" | "inner" | "speech";

/** One rendered line of the feed, ready to draw. */
export interface FeedLine {
  /** Speaker id from `world.speakers`; null for old prose (`text`, `outcome`). */
  who: string | null;
  label: string;
  color: string | null;
  style: LineStyle;
  text: string;
}

/** say: the player's line. do: an action. plain: a bare button (doors, old cards). */
export type ChoiceMode = "say" | "do" | "plain";

/** How a choice is labelled: the first of `say`, `do`, `text` it has (the validator requires one). */
export function choiceLabel(choice: Choice): { mode: ChoiceMode; text: string } {
  if (choice.say !== undefined) return { mode: "say", text: choice.say };
  if (choice.do !== undefined) return { mode: "do", text: choice.do };
  return { mode: "plain", text: choice.text ?? "" };
}

function prose(text: string, state: Bags, world: World): FeedLine[] {
  return paragraphs(renderText(text, state, world)).map((p) => ({ who: null, label: "", color: null, style: "narrator", text: p }));
}

/** Lines whose `when` holds, rendered. A `rumor: true` line speaks tonight's rumor and is dropped when there is none. */
export function renderLines(lines: readonly Line[], state: Bags, world: World): FeedLine[] {
  const out: FeedLine[] = [];
  for (const line of lines) {
    if (!evaluateAll(state, world, line.when)) continue;
    const text = line.rumor ? currentRumor(state, world)?.text : line.text;
    if (text === undefined) continue;
    const speaker = world.speakers[line.who];
    out.push({
      who: line.who,
      label: speaker?.label ?? line.who,
      color: speaker?.color ?? null,
      style: speaker?.style ?? "speech",
      text: renderText(text, state, world),
    });
  }
  return out;
}

/** What a card says before its choices: `lines`, or old `text` as narrator lines, one per paragraph. */
export function sceneLines(state: Bags, world: World, storylet: Storylet): FeedLine[] {
  return storylet.lines ? renderLines(storylet.lines, state, world) : prose(storylet.text ?? "", state, world);
}

/** What follows a choice: `reply`, or old `outcome` as narrator lines. Rendered on the state after the choice's effects. */
export function replyLines(state: Bags, world: World, choice: Choice): FeedLine[] {
  return choice.reply ? renderLines(choice.reply, state, world) : prose(choice.outcome ?? "", state, world);
}

export type FeedEntry = ({ kind: "line" } & FeedLine) | { kind: "pick"; mode: ChoiceMode; text: string };

/** The running transcript of one place: lines stay above while the player remains at `location`. */
export interface Feed {
  location: string;
  entries: FeedEntry[];
}

const asEntries = (lines: FeedLine[]): FeedEntry[] => lines.map((l) => ({ kind: "line", ...l }));

/** The player's pick as it falls into the feed, then its reply. Pledges and walks leave no line. */
function pickEntries(entry: LogEntry, state: GameState, world: World): FeedEntry[] {
  const choice = findStorylet(world, entry.storylet).choices[entry.choice];
  if (!choice) return [];
  const label = choiceLabel(choice);
  return [{ kind: "pick", mode: label.mode, text: renderText(label.text, state, world) }, ...asEntries(replyLines(state, world, choice))];
}

/** A fresh feed for the place the state is in: the card's lines, plus the pick and reply still on screen in phase "outcome". */
export function openFeed(state: GameState, world: World): Feed {
  if (state.phase !== "scene" && state.phase !== "outcome") return { location: state.location, entries: [] };
  const entries = asEntries(sceneLines(state, world, findStorylet(world, state.storyletId)));
  const last = state.log.at(-1);
  if (state.phase === "outcome" && last) entries.push(...pickEntries(last, state, world));
  return { location: state.location, entries };
}

/** The feed after one action (`prev` -> `next`). Staying in place appends the pick, its reply and the lines of a
 *  card that took over; arriving elsewhere starts a new feed; a finished night leaves the feed as it was. */
export function extendFeed(feed: Feed, prev: GameState, next: GameState, world: World): Feed {
  if (next.phase !== "scene" && next.phase !== "outcome") return feed;
  if (next.location !== feed.location) return openFeed(next, world);
  const entries = [...feed.entries];
  const last = next.log.at(-1);
  if (next.log.length > prev.log.length && last) entries.push(...pickEntries(last, next, world));
  if (next.phase === "scene" && next.storyletId !== prev.storyletId) entries.push(...asEntries(sceneLines(next, world, findStorylet(world, next.storyletId))));
  return { location: feed.location, entries };
}
