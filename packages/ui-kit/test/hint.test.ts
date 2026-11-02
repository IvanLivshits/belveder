import { describe, expect, test } from "bun:test";
import { HINT_EXTRA_MS, READING_WPM, readingTime } from "../src/reading";

describe("hint reading time", () => {
  test("words ÷ wpm + margin; whitespace does not count as words", () => {
    expect(readingTime("")).toBe(HINT_EXTRA_MS);
    expect(readingTime("  одно  ")).toBe(Math.round(60_000 / READING_WPM) + HINT_EXTRA_MS);
    const words = Array.from({ length: 18 }, (_, i) => `w${i}`).join(" ");
    expect(readingTime(words)).toBe(6_000 + HINT_EXTRA_MS); // 18 words at 180 wpm = 6 s
    expect(readingTime(words, 60, 0)).toBe(18_000);
  });

  test("the longest real hint stays well over the old four seconds", () => {
    const turn = "Каждое действие стоит времени. Ночь длится 16 ходов, с 22:00 до 06:00. На рассвете ты окажешься у Долли, где бы ни был.";
    expect(readingTime(turn)).toBeGreaterThan(11_000);
  });
});
