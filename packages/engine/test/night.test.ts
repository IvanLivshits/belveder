import { describe, expect, test } from "bun:test";
import { choose, currentScene, emptyProfile, newNight, profileOf } from "../src";
import { expectGolden } from "./golden-helper";
import { miniWorld } from "./mini-world";

const DIR = import.meta.dir;

describe("mini world night", () => {
  test("full night is deterministic and ends by rule", async () => {
    let s = newNight(emptyProfile(), miniWorld, 42);
    expect(s.storyletId).toBe("hall_a");
    s = choose(s, miniWorld, 1); // wait, heat 1
    expect(s.run["heat"]).toBe(1);
    expect(currentScene(s, miniWorld).choices.length).toBe(1); // hall_b/c have one choice
    s = choose(s, miniWorld, 0); // to room
    expect(currentScene(s, miniWorld).choices.every((c) => c.available)).toBe(true); // hidden choice unlocked by heat
    s = choose(s, miniWorld, 1); // heat back to 0
    s = choose(s, miniWorld, 0); // turn 4 -> night ends
    expect(s.phase).toBe("report");
    expect(s.profile["nights"]).toBe(1);
    expect(s.report["summary"]).toBe("sum_default");
    await expectGolden(DIR, "mini-night-42", s);
  });

  test("same seed and actions give identical state", () => {
    const run = () => {
      let s = newNight(emptyProfile(), miniWorld, 7);
      s = choose(s, miniWorld, 1);
      s = choose(s, miniWorld, 0);
      return s;
    };
    expect(run()).toEqual(run());
  });

  test("different seeds can pick different tie-break storylets", () => {
    const picks = new Set<string>();
    for (let seed = 1; seed < 20; seed++) {
      const s = choose(newNight(emptyProfile(), miniWorld, seed), miniWorld, 1);
      picks.add(s.storyletId);
    }
    expect(picks).toEqual(new Set(["hall_b", "hall_c"]));
  });

  test("endNight choice is free and profile survives", () => {
    let s = newNight(emptyProfile(), miniWorld, 1);
    s = choose(s, miniWorld, 0);
    s = choose(s, miniWorld, 0); // trust 1, back in hall (hall_b or c)
    s = newNight(profileOf(s), miniWorld, 2);
    expect(s.profile["trust"]).toBe(1);
    expect(s.run).toEqual({});
    s = choose(s, miniWorld, 2);
    expect(s.phase).toBe("report");
    expect(s.run["turn"]).toBeUndefined();
    expect(s.report["summary"]).toBe("sum_trust");
  });

  test("unavailable choice throws", () => {
    const s = newNight(emptyProfile(), miniWorld, 1);
    expect(() => choose(s, miniWorld, 5)).toThrow(/not available/);
  });

  test("clamps to min/max", () => {
    let s = newNight(emptyProfile(), miniWorld, 1);
    for (let i = 0; i < 3; i++) {
      s = choose(s, miniWorld, 1);
      if (s.phase === "report") break;
      s = newNight(profileOf(s), miniWorld, 1);
    }
    expect(s.run["heat"] ?? 0).toBeLessThanOrEqual(5);
  });
});
