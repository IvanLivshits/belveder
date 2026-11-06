/** Average adult reading speed, words per minute (Russian prose; a conservative figure). */
export const READING_WPM = 180;
/** Added on top of the reading time: noticing the hint and looking back at the scene. */
export const HINT_EXTRA_MS = 5000;

/** How long a hint stays: words ÷ reading speed + a fixed margin. */
export function readingTime(text: string, wpm = READING_WPM, extraMs = HINT_EXTRA_MS): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((words / wpm) * 60_000) + extraMs;
}

/** Pace of the feed: a skim, not a read (a tap shows everything at once). */
export const FEED_WPM = 480;
export const FEED_EXTRA_MS = 350;
export const FEED_MAX_MS = 2200;

/** Pause after a feed line before the next one appears. */
export function lineDelay(text: string): number {
  return Math.min(FEED_MAX_MS, readingTime(text, FEED_WPM, FEED_EXTRA_MS));
}
