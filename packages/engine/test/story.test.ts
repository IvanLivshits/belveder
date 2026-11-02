/** Endings, the night history and the final story on the mini world. */
import { describe, expect, test } from "bun:test";
import { choose, continueOutcome, currentScene, emptyProfile, endingView, newCase, newNight, parseProfile, parseRun, pledge, profileOf, serializeProfile, serializeRun, storyView, type Profile } from "../src";
import { miniWorld as w } from "./mini-world";

/** hall -> room -> vault with an outcome on the way. */
const toVault = (p: Profile, seed = 3) => { let s = newNight(p, w, seed); s = choose(s, w, 0); s = choose(s, w, 2); return continueOutcome(s, w); };

describe("night history", () => {
  test("every finished night is recorded: pledged flag, pawned pair, report ids and placeholder values", () => {
    let s = pledge(toVault({ v: 1, profile: { trust: 1 } }), w, "a"); // heat 2, a returns
    expect(s.history).toEqual({ nights: [{ pledged: false, pair: "a", report: { summary: "sum_returned" }, values: {} }], pledges: ["a"] });
    let n = choose(toVault(profileOf(s)), w, 0); // pledge the night as a whole
    expect(n.history.nights[1]).toEqual({ pledged: true, report: { summary: "sum_trust" }, values: {} });
    expect(n.history.pledges).toEqual(["a"]);
    n = pledge(toVault(profileOf(n)), w, "b"); // b does not return; sum_trust still
    expect(n.history.nights.length).toBe(3);
    expect(n.history.pledges).toEqual(["a", "b"]);
    // values of the placeholders the chosen fragments use are frozen at report time
    const cold = choose(toVault(emptyProfile()), w, 0); // trust 0 -> sum_default "nothing (heat {heat})", heat 2
    expect(cold.history.nights[0]).toEqual({ pledged: true, report: { summary: "sum_default" }, values: { heat: 2 } });
    expect(newNight(profileOf(n), w, 9).history.nights.length).toBe(3); // carried into the next night untouched
  });

  test("a profile without history (older save) starts empty", () => {
    const s = newNight({ v: 1, profile: { trust: 1 } }, w, 1);
    expect(s.history).toEqual({ nights: [], pledges: [] });
  });
});

describe("ending", () => {
  test("an ending choice flags endings.<id>, closes the night like any other and lands in phase ending", () => {
    let s = toVault({ v: 1, profile: { trust: 2 } });
    expect(currentScene(s, w).choices.map((c) => c.available)).toEqual([true, true]);
    s = choose(s, w, 1);
    expect(s.phase).toBe("outcome");
    s = continueOutcome(s, w);
    expect(s.phase).toBe("ending");
    expect(s.ending).toBe("fire");
    expect(s.profile["endings.fire"]).toBe(1);
    expect(s.profile["nights"]).toBe(1);
    expect(s.report["summary"]).toBe("sum_trust");
    expect(s.history.nights).toEqual([{ pledged: false, report: { summary: "sum_trust" }, values: {} }]);
    expect(() => choose(s, w, 0)).toThrow(/outside a scene/);
    const view = endingView(s, w);
    expect(view).toEqual({ id: "fire", title: "Fire", image: "bg", paragraphs: ["The vault burns.", "Nothing is left, trust 2."], epilogues: ["Ash."] });
    // epilogues can look at endings of earlier cases
    const again = continueOutcome(choose(toVault({ v: 1, profile: { trust: 2, "endings.water": 1 } }), w, 1), w);
    expect(endingView(again, w).epilogues).toEqual(["Ash.", "Steam, too."]);
    expect(() => endingView(toVault(emptyProfile()), w)).toThrow(/no ending/);
  });

  test("the ending is not offered before its condition holds", () => {
    const s = toVault(emptyProfile());
    expect(currentScene(s, w).choices.map((c) => c.available)).toEqual([true, false]);
  });
});

describe("story", () => {
  /** Three nights: a returns (night 1), a pawned night (2), b lost (3); then the ending on night 4. */
  const campaign = () => {
    let s = pledge(toVault({ v: 1, profile: { trust: 2 } }), w, "a");
    s = choose(toVault(profileOf(s)), w, 0);
    s = pledge(toVault(profileOf(s)), w, "b");
    s = continueOutcome(choose(toVault(profileOf(s)), w, 1), w);
    return s;
  };

  test("opening, the unpawned nights, the pawned note, the litany of prices, the ending, epilogues and closing", () => {
    const s = campaign();
    expect(s.phase).toBe("ending");
    const story = storyView(profileOf(s), w, "fire");
    expect(story.title).toBe("The Case");
    expect(story.sections).toEqual([
      { kind: "opening", text: "a came back" },
      { kind: "night", night: 1, entries: [{ slot: "summary", label: "Summary", text: "a came back" }] },
      { kind: "night", night: 3, entries: [{ slot: "summary", label: "Summary", text: "trusted" }] },
      { kind: "night", night: 4, entries: [{ slot: "summary", label: "Summary", text: "trusted" }] },
      { kind: "pledged_note", text: "Some nights are gone." },
      { kind: "litany", intro: "Paid:", text: "a came back trusted" },
      { kind: "ending", title: "Fire", paragraphs: ["The vault burns.", "Nothing is left, trust 2."] },
      { kind: "epilogues", texts: ["Ash."] },
      { kind: "closing", text: "The end." },
    ]);
  });

  test("placeholders in saved pages use the values recorded that night, not today's", () => {
    let s = choose(toVault(emptyProfile()), w, 0); // sum_default with heat 2, pawned night
    s = continueOutcome(choose(toVault({ ...profileOf(s), profile: { ...profileOf(s).profile, trust: 2 } }), w, 1), w);
    const story = storyView({ ...profileOf(s), history: { nights: [{ pledged: false, report: { summary: "sum_default" }, values: { heat: 2 } }], pledges: [] } }, w, "fire");
    expect(story.sections[0]).toEqual({ kind: "opening", text: "nothing (heat 2)" });
    expect(story.sections.find((x) => x.kind === "litany")).toBeUndefined();
    expect(story.sections.find((x) => x.kind === "pledged_note")).toBeUndefined();
  });

  test("a new case keeps only endings.* and starts the history over", () => {
    const s = campaign();
    const fresh = newCase(profileOf(s));
    expect(fresh).toEqual({ v: 1, profile: { "endings.fire": 1 }, history: { nights: [], pledges: [] } });
    const n = newNight(fresh, w, 1);
    expect(n.profile).toEqual({ "endings.fire": 1 });
    expect(n.history).toEqual({ nights: [], pledges: [] });
  });

  test("unknown ending or a world without endings throw", () => {
    expect(() => storyView(emptyProfile(), w, "nope")).toThrow(/unknown ending/);
    expect(() => storyView(emptyProfile(), { ...w, endings: undefined }, "fire")).toThrow(/no endings/);
  });
});

describe("history codec", () => {
  test("profile round-trips nights, pairs, values and pledges; a run keeps the ending id", () => {
    const s = (() => {
      let x = pledge(toVault({ v: 1, profile: { trust: 2 } }), w, "a");
      x = choose(toVault(profileOf(x)), w, 0);
      return continueOutcome(choose(toVault(profileOf(x)), w, 1), w);
    })();
    const p = profileOf(s);
    expect(serializeProfile(p)).toBe("b1;q.endings.fire=1;q.mem.false.a=0;q.mem.true.a=1;q.memories_returned=1;q.nights=3;q.trust=2;h=0/a/summary:sum_returned/,1//summary:sum_trust/,0//summary:sum_trust/;pl=a");
    expect(parseProfile(serializeProfile(p))).toEqual(p);
    const run = parseRun(serializeRun(s), p);
    expect(run).toEqual(s);
    expect(run.ending).toBe("fire");
    // a night that froze placeholder values
    const withValues: Profile = { v: 1, profile: {}, history: { nights: [{ pledged: true, report: { summary: "sum_default" }, values: { heat: 2, "mem.true.a": 0 } }], pledges: [] } };
    expect(parseProfile(serializeProfile(withValues))).toEqual(withValues);
  });

  test("a profile document from before the story decodes with an empty history", () => {
    expect(parseProfile("b1;q.trust=3")).toEqual({ v: 1, profile: { trust: 3 }, history: { nights: [], pledges: [] } });
    const run = parseRun(serializeRun(newNight({ v: 1, profile: { trust: 3 } }, w, 1)).replace(";end=", ""), { v: 1, profile: { trust: 3 } });
    expect(run.ending).toBeNull();
    expect(run.history).toEqual({ nights: [], pledges: [] });
  });
});
