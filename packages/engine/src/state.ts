import type { World } from "@belvedere/content-schema";
import type { RngState } from "./rng";

export const STATE_VERSION = 1;

export type Qualities = Record<string, number>;

export interface LogEntry {
  storylet: string;
  /** Index into storylet.choices (original, not filtered); -1 for a memory pledge. */
  choice: number;
  /** Memory pair id when the entry is a pledge. */
  pair?: string;
}

/** scene: waiting for a choice. outcome: showing a choice's outcome text. report: night over.
 *  ending: the game is over (`state.ending` names the ending; the report is built too). */
export type Phase = "scene" | "outcome" | "report" | "ending";

/** One finished night, kept in the profile for the final story. */
export interface NightRecord {
  /** The night was pawned as a whole (`rules.pledgedNightWhen` held): left out of the story. */
  pledged: boolean;
  /** Memory pair pawned that night, if any. */
  pair?: string;
  /** slot -> fragment id. */
  report: Record<string, string>;
  /** Values of the placeholders used by those fragments, as they were at report time. */
  values: Record<string, number>;
}
/** Everything the final story needs, in play order. */
export interface History {
  nights: NightRecord[];
  /** Memory pair ids, in the order they were pawned. */
  pledges: string[];
}
export const emptyHistory = (): History => ({ nights: [], pledges: [] });

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
