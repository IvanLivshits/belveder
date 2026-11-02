import { describe, expect, test } from "bun:test";
import { choose, continueOutcome, currentOutcome, currentScene, emptyProfile, newNight, pledge, profileOf, renderText } from "../src";
import { expectGolden } from "./golden-helper";
import { miniWorld } from "./mini-world";

const DIR = import.meta.dir;

describe("mini world night", () => {
  test("full night is deterministic; turn 4 interrupt sends to the vault, pledge ends it", async () => {
    let s = newNight(emptyProfile(), miniWorld, 42);
    expect(s.storyletId).toBe("hall_a");
    s = choose(s, miniWorld, 1); // wait, heat 1
    expect(s.run["heat"]).toBe(1);
    expect(currentScene(s, miniWorld).choices.length).toBe(1); // hall_b/c have one choice
    s = choose(s, miniWorld, 0); // to room
    expect(currentScene(s, miniWorld).choices.every((c) => c.available)).toBe(true); // hidden choice unlocked by heat
    s = choose(s, miniWorld, 1); // heat back to 0
    s = choose(s, miniWorld, 0); // turn 4 -> interrupt overrides goto hall
    expect(s.phase).toBe("scene");
    expect(s.location).toBe("vault");
    expect(s.storyletId).toBe("vault_pledge");
    s = choose(s, miniWorld, 0); // pledge the night
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

  test("a choice's own goto is used when no interrupt matches", () => {
    let s = newNight(emptyProfile(), miniWorld, 1);
    s = choose(s, miniWorld, 0);
    expect(s.location).toBe("room");
  });

  test("outcome pauses the move, applies effects first, then goto", () => {
    let s = newNight(emptyProfile(), miniWorld, 3);
    s = choose(s, miniWorld, 0); // to room
    expect(currentScene(s, miniWorld).text).toBe("X heat=0");
    s = choose(s, miniWorld, 2);
    expect(s.phase).toBe("outcome");
    expect(s.location).toBe("room"); // goto not yet applied
    expect(s.run["heat"]).toBe(2);
    expect(s.run["turn"]).toBe(2); // onChoice applied before the outcome screen
    expect(currentOutcome(s, miniWorld).text).toBe("Heat is now 2, trust 0.");
    expect(() => choose(s, miniWorld, 0)).toThrow(/outside a scene/);
    s = continueOutcome(s, miniWorld);
    expect(s.phase).toBe("scene");
    expect(s.location).toBe("vault");
    expect(s.pendingChoice).toBeNull();
  });

  test("interrupts are checked after the outcome screen and on free choices too", () => {
    let t = newNight(emptyProfile(), miniWorld, 3);
    t = choose(t, miniWorld, 0); // turn 1, room
    t = choose(t, miniWorld, 0); // turn 2, hall
    t = choose(t, miniWorld, 0); // turn 3, room
    t = choose(t, miniWorld, 2); // turn 4 with outcome: interrupt fires only after continue
    expect(t.phase).toBe("outcome");
    expect(t.location).toBe("room");
    t = continueOutcome(t, miniWorld);
    expect(t.location).toBe("vault");
    // endNight beats interrupts: the vault's night pledge still ends the night at turn >= 4
    t = choose(t, miniWorld, 0);
    expect(t.phase).toBe("report");
  });

  test("pledge: false flag to 0, true flag to 1 when returnWhen holds, night ends", () => {
    let s = newNight({ v: 1, profile: { trust: 1 } }, miniWorld, 3);
    expect(currentScene(s, miniWorld).memories).toEqual([]);
    s = choose(s, miniWorld, 0); // room
    s = choose(s, miniWorld, 2); // vault, outcome
    s = continueOutcome(s, miniWorld);
    expect(s.storyletId).toBe("vault_pledge");
    const scene = currentScene(s, miniWorld);
    // trust 1 satisfies a's returnWhen, heat < 9 does not satisfy b's
    expect(scene.memories).toEqual([{ id: "a", label: "False A", canReturn: true }, { id: "b", label: "False B", canReturn: false }]);
    s = pledge(s, miniWorld, "a");
    expect(s.phase).toBe("report");
    expect(s.profile["mem.false.a"]).toBe(0);
    expect(s.profile["mem.true.a"]).toBe(1);
    expect(s.run["pledged.a"]).toBe(1);
    expect(s.run["returned.a"]).toBe(1);
    expect(s.profile["memories_returned"]).toBe(1);
    expect(s.run["night_pledged"]).toBeUndefined();
    expect(s.report["summary"]).toBe("sum_returned"); // report sees this night's run flags
    expect(s.log.at(-1)).toEqual({ storylet: "vault_pledge", choice: -1, pair: "a" });
    // next night: a is gone, b still pawnable; pawning b does not return (heat < 9)
    let n = newNight(profileOf(s), miniWorld, 4);
    expect(n.run["pledged.a"]).toBeUndefined(); // run flags reset
    n = choose(n, miniWorld, 0); n = choose(n, miniWorld, 2); n = continueOutcome(n, miniWorld);
    expect(currentScene(n, miniWorld).memories).toEqual([{ id: "b", label: "False B", canReturn: false }]);
    expect(() => pledge(n, miniWorld, "a")).toThrow(/not available/);
    n = pledge(n, miniWorld, "b");
    expect(n.profile["mem.false.b"]).toBe(0);
    expect(n.profile["mem.true.b"]).toBeUndefined();
    expect(n.run["pledged.b"]).toBe(1);
    expect(n.run["returned.b"]).toBeUndefined();
    expect(n.profile["memories_returned"]).toBe(1);
  });

  test("pledge the night is a plain choice; memories untouched", () => {
    let s = newNight(emptyProfile(), miniWorld, 3);
    s = choose(s, miniWorld, 0); s = choose(s, miniWorld, 2); s = continueOutcome(s, miniWorld);
    s = choose(s, miniWorld, 0);
    expect(s.phase).toBe("report");
    expect(s.run["night_pledged"]).toBe(1);
    expect(s.profile["mem.false.a"]).toBeUndefined(); // still default 1
  });

  test("pledge outside a pledge screen throws", () => {
    const s = newNight(emptyProfile(), miniWorld, 3);
    expect(() => pledge(s, miniWorld, "a")).toThrow(/not a pledge screen/);
  });

  test("renderText substitutes declared qualities and leaves the rest", () => {
    const s = newNight({ v: 1, profile: { trust: 4 } }, miniWorld, 1);
    expect(renderText("trust {trust}, heat {heat}, {unknown}, {not an id}", s, miniWorld)).toBe("trust 4, heat 0, {unknown}, {not an id}");
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
