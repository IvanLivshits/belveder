/** Pure view helpers: choice cost, max clamping, change detection, report notes, notebook. */
import { describe, expect, test } from "bun:test";
import { WorldSchema, type World, type WorldInput } from "@belvedere/content-schema";
import { changedQualities, choiceCost, choose, clockQuality, clockTime, continueOutcome, currentNotes, emptyProfile, evidenceView, isTense, lifeStatus, morningNotes, newNight, notebookView, pledge, profileOf } from "../src";
import { miniWorld } from "./mini-world";

const variant = (patch: (w: WorldInput) => void): World => {
  const w = structuredClone(miniWorld) as WorldInput;
  patch(w);
  return WorldSchema.parse(w);
};

describe("choice cost", () => {
  test("clock is the quality onChoice increments", () => {
    expect(clockQuality(miniWorld)).toBe("turn");
    expect(clockQuality(variant((w) => { w.rules.onChoice = []; }))).toBeNull();
  });

  test("free 0, plain 1, own turn effect adds on top", () => {
    const w = variant((w) => { w.storylets[0]!.choices[1]!.effects = ["seen.hall_a = 1", "turn += 1"]; });
    const s = newNight(emptyProfile(), w, 1);
    const [go, wait, leave] = w.storylets[0]!.choices;
    expect(choiceCost(s, w, go!)).toBe(1);
    expect(choiceCost(s, w, wait!)).toBe(2);
    expect(choiceCost(s, w, leave!)).toBe(0);
  });
});

describe("max clamps effects", () => {
  test("turn 3 + own turn += 1 + onChoice stays at max 4, not 5", () => {
    const w = variant((w) => {
      w.qualities[0] = { id: "turn", scope: "run", min: 0, max: 4 };
      w.storylets[0]!.choices[1]!.effects = ["seen.hall_a = 1", "turn += 1"];
    });
    let s = newNight(emptyProfile(), w, 1);
    s = { ...s, run: { ...s.run, turn: 3 } };
    s = choose(s, w, 1);
    expect(s.run["turn"]).toBe(4);
    expect(s.location).toBe("vault"); // the turn >= 4 interrupt still fires
  });
});

describe("changed qualities", () => {
  test("lists every quality that moved, including back to default", () => {
    let a = newNight(emptyProfile(), miniWorld, 1);
    let b = choose(a, miniWorld, 1); // wait: seen.hall_a, heat, turn
    expect(changedQualities(a, b, miniWorld)).toEqual(["heat", "seen.hall_a", "turn"]);
    a = choose(b, miniWorld, 0); // to room
    b = choose(a, miniWorld, 1); // hidden: heat back to 0 (dropped from the bag)
    expect(changedQualities(a, b, miniWorld)).toEqual(["heat", "turn"]);
    expect(changedQualities(a, a, miniWorld)).toEqual([]);
  });
});

describe("report notes and notebook", () => {
  const w = variant((w) => {
    w.report.notes = [{ when: ["returned.a == 1"], text: "a is back" }, { text: "always, heat {heat}" }];
    w.morning = { notes: [{ when: ["night_pledged == 1"], text: "same list" }, { when: ["night_pledged == 0", "returned_tonight == 0"], text: "a hole" }, { when: ["returned_tonight == 1"], text: "new hand" }] };
    w.notebook = {
      life: { title: "Me", intro: "intro", states: { fake: "{label_fake}", empty: "~~{label_fake}~~ — nothing", real: "~~{label_fake}~~ → {label_real}" }, footer: { when: ["memories_returned >= 1"], text: "footer" } },
      pages: [
        { id: "open", title: "Open", text: "t", rule: "r" },
        { id: "trusted", title: "Trusted", text: "trust {trust}", rule: "r", when: ["trust >= 1"] },
      ],
    };
  });

  test("notes: matching ones in order, rendered", () => {
    let s = newNight({ v: 1, profile: { trust: 1 } }, w, 3);
    s = choose(s, w, 0); s = choose(s, w, 2); s = continueOutcome(s, w);
    s = pledge(s, w, "a");
    expect(currentNotes(s, w)).toEqual(["a is back", "always, heat 2"]);
  });

  test("morning notes: exactly one of pledged night / hole / new hand", () => {
    const toVault = (p: { v: 1; profile: Record<string, number> }) => { let s = newNight(p, w, 3); s = choose(s, w, 0); s = choose(s, w, 2); return continueOutcome(s, w); };
    expect(morningNotes(choose(toVault({ v: 1, profile: {} }), w, 0), w)).toEqual(["same list"]);
    expect(morningNotes(pledge(toVault({ v: 1, profile: {} }), w, "a"), w)).toEqual(["a hole"]); // trust 0: a does not return
    expect(morningNotes(pledge(toVault({ v: 1, profile: { trust: 1 } }), w, "a"), w)).toEqual(["new hand"]);
    expect(morningNotes(pledge(toVault({ v: 1, profile: { trust: 1 } }), w, "a"), miniWorld)).toEqual([]);
  });

  test("notebook: pages unlock on profile, life lines follow the pairs", () => {
    let s = newNight(emptyProfile(), w, 3);
    let v = notebookView(s, w)!;
    expect(v.pages.map((p) => p.id)).toEqual(["open"]);
    expect(v.locked).toBe(1);
    expect(v.life.footer).toBeNull();
    expect(v.life.lines).toEqual([
      { pair: "a", status: "fake", text: "False A" },
      { pair: "b", status: "fake", text: "False B" },
    ]);
    s = choose(s, w, 0); s = choose(s, w, 0); // trust 1
    s = choose(s, w, 0); s = choose(s, w, 2); s = continueOutcome(s, w);
    s = pledge(s, w, "a");
    v = notebookView(s, w)!;
    expect(v.pages.map((p) => p.id)).toEqual(["open", "trusted"]);
    expect(v.pages[1]!.text).toBe("trust 1");
    expect(lifeStatus(s, w, "a")).toBe("real");
    expect(v.life.footer).toBe("footer"); // first return
    expect(v.life.lines[0]!.text).toBe("~~False A~~ → True A");
    // pawning b without its returnWhen leaves an empty line
    let n = newNight({ v: 1, profile: { ...s.profile } }, w, 4);
    n = choose(n, w, 0); n = choose(n, w, 2); n = continueOutcome(n, w);
    n = pledge(n, w, "b");
    expect(notebookView(n, w)!.life.lines[1]).toEqual({ pair: "b", status: "empty", text: "~~False B~~ — nothing" });
    expect(notebookView(s, miniWorld)).toBeNull();
  });
});

describe("clock", () => {
  test("start + value × step, wrapping past midnight; null without rules.clock", () => {
    const s = newNight(emptyProfile(), miniWorld, 1);
    expect(clockTime(s, miniWorld)).toBe("22:00");
    expect(clockTime({ ...s, run: { turn: 3 } }, miniWorld)).toBe("23:30");
    expect(clockTime({ ...s, run: { turn: 4 } }, miniWorld)).toBe("00:00");
    expect(clockTime({ ...s, run: { turn: 7 } }, miniWorld)).toBe("01:30");
    expect(clockTime(s, variant((w) => { delete w.rules.clock; }))).toBeNull();
  });
});

describe("evidence folder", () => {
  const w = variant((w) => {
    w.qualities.push({ id: "found.*", scope: "profile", min: 0, max: 1 });
    w.evidence = { items: [
      { id: "hall", order: 20, flag: "seen.hall_a", image: "bg", title: "Hall", text: "a" },
      { id: "hot", order: 10, flag: "heat", title: "Heat", text: "h" },
      { id: "never", order: 30, flag: "night_pledged", title: "Never", text: "n" },
    ] };
  });

  test("a run flag at 1 sets found.<id> in the profile; the view lists found cards in order, tonight's marked", () => {
    let s = newNight(emptyProfile(), w, 1);
    expect(evidenceView(s, w)).toEqual({ items: [], locked: 3 });
    s = choose(s, w, 1); // wait: seen.hall_a = 1, heat = 1
    expect(s.profile["found.hall"]).toBe(1);
    expect(s.profile["found.hot"]).toBe(1);
    expect(evidenceView(s, w).items.map((i) => [i.id, i.tonight])).toEqual([["hot", true], ["hall", true]]);
    expect(evidenceView(s, w).items[1]).toEqual({ id: "hall", title: "Hall", image: "bg", text: "a", tonight: true });
    expect(evidenceView(s, w).locked).toBe(1);
    // the flag going back to 0 does not unfind the card
    s = choose(s, w, 0); s = choose(s, w, 1); // room -> hidden: heat back to 0
    expect(evidenceView(s, w).items.map((i) => [i.id, i.tonight])).toEqual([["hot", false], ["hall", true]]);
    // next night: everything is remembered, nothing is from tonight
    const n = newNight(profileOf(s), w, 2);
    expect(evidenceView(n, w).items.map((i) => [i.id, i.tonight])).toEqual([["hot", false], ["hall", false]]);
  });

  test("a world without evidence has an empty folder and never writes found.*", () => {
    let s = newNight(emptyProfile(), miniWorld, 1);
    s = choose(s, miniWorld, 1);
    expect(evidenceView(s, miniWorld)).toEqual({ items: [], locked: 0 });
    expect(Object.keys(s.profile).filter((k) => k.startsWith("found."))).toEqual([]);
  });
});

describe("tension", () => {
  const tense = variant((w) => { w.rules.tensionWhen = ["heat >= 1"]; });

  test("follows the quality that the rule names", () => {
    let s = newNight(emptyProfile(), tense, 1);
    expect(isTense(s, tense)).toBe(false);
    s = choose(s, tense, 1); // "wait": heat += 1
    expect(isTense(s, tense)).toBe(true);
  });

  test("a new night starts calm again", () => {
    const s = choose(newNight(emptyProfile(), tense, 1), tense, 1);
    expect(isTense(newNight(profileOf(s), tense, 2), tense)).toBe(false);
  });

  test("without the rule it is never tense", () => {
    const s = choose(newNight(emptyProfile(), miniWorld, 1), miniWorld, 1);
    expect(isTense(s, miniWorld)).toBe(false);
  });
});
