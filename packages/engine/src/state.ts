import type { World } from "@belvedere/content-schema";
import type { RngState } from "./rng";

export const STATE_VERSION = 1;

export type Qualities = Record<string, number>;

export interface LogEntry {
  storylet: string;
  /** Index into storylet.choices (original, not filtered); -1 for a memory pledge or a walk on the stairs. */
  choice: number;
  /** Memory pair id when the entry is a pledge. */
  pair?: string;
  /** Target floor when the entry is a walk on the stairs. */
  floor?: number;
}

/** scene: waiting for a choice. outcome: showing a choice's outcome text. report: night over.
 *  ending: the game is over (`state.ending` names the ending; the report is built too). */
export type Phase = "scene" | "outcome" | "report" | "ending";

/** One finished night, kept in the profile for the final story. */
export interface NightRecord {
  /** The night's real number: the quality `rules.onNightEnd` increments, plus one (see `nightQuality`). */
  night: number;
  /** The night was pawned as a whole (`rules.pledgedNightWhen` held): left out of the story. */
  pledged: boolean;
  /** Memory pair pawned that night, if any. */
  pair?: string;
  /** slot -> fragment id. */
  report: Record<string, string>;
  /** Values of the placeholders used by those fragments, as they were at report time. */
  values: Record<string, number>;
  /** The rumor drawn that night, if any (the next night draws a different one). */
  rumor?: string;
}
/** Everything the final story needs, in play order. */
export interface History {
  nights: NightRecord[];
  /** Memory pair ids, in the order they were pawned. */
  pledges: string[];
  /** Qualities from `notebook.vouchers.names` in the order they were first set; absent while there are none. */
  vouchers?: string[];
}
export const emptyHistory = (): History => ({ nights: [], pledges: [] });
/** An independent copy; a history from before a field existed reads as empty there. */
export function copyHistory(h: History | undefined): History {
  return { nights: [...(h?.nights ?? [])], pledges: [...(h?.pledges ?? [])], ...(h?.vouchers?.length ? { vouchers: [...h.vouchers] } : {}) };
}

export interface GameState {
  v: typeof STATE_VERSION;
  seed: number;
  rng: RngState;
  phase: Phase;
  location: string;
  storyletId: string;
  /** Choice whose outcome is on screen (phase === "outcome"). */
  pendingChoice: number | null;
  run: Qualities;
  profile: Qualities;
  log: LogEntry[];
  /** slot -> fragment id; filled when phase === "report" or "ending". */
  report: Record<string, string>;
  history: History;
  /** Ending id when phase === "ending". */
  ending: string | null;
}

/** Profile-only part that survives between nights. */
export interface Profile {
  v: typeof STATE_VERSION;
  profile: Qualities;
  /** Absent in profiles saved before the story existed: no nights recorded yet. */
  history?: History;
}

export class EngineError extends Error {
  override name = "EngineError";
}

export function emptyProfile(): Profile {
  return { v: STATE_VERSION, profile: {}, history: emptyHistory() };
}

export function findStorylet(world: World, id: string) {
  const s = world.storylets.find((x) => x.id === id);
  if (!s) throw new EngineError(`unknown storylet: ${id}`);
  return s;
}
