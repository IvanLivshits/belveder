/** Average adult reading speed, words per minute (Russian prose; a conservative figure). */
export const READING_WPM = 180;
/** Added on top of the reading time: noticing the hint and looking back at the scene. */
export const HINT_EXTRA_MS = 5000;

/** How long a hint stays: words ÷ reading speed + a fixed margin. */
export function readingTime(text: string, wpm = READING_WPM, extraMs = HINT_EXTRA_MS): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((words / wpm) * 60_000) + extraMs;
}
