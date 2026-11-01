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

/** scene: waiting for a choice. outcome: showing a choice's outcome text. report: night over. */
export type Phase = "scene" | "outcome" | "report";

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
  /** slot -> fragment id; filled when phase === "report". */
  report: Record<string, string>;
}

/** Profile-only part that survives between nights. */
export interface Profile {
  v: typeof STATE_VERSION;
  profile: Qualities;
}

export class EngineError extends Error {
  override name = "EngineError";
}

export function emptyProfile(): Profile {
  return { v: STATE_VERSION, profile: {} };
}

export function findStorylet(world: World, id: string) {
  const s = world.storylets.find((x) => x.id === id);
  if (!s) throw new EngineError(`unknown storylet: ${id}`);
  return s;
}
