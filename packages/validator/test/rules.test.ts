import { describe, expect, test } from "bun:test";
import { WorldSchema, type AssetManifest, type WorldInput } from "@belvedere/content-schema";
import { miniWorld } from "../../engine/test/mini-world";
import { rules, runRules } from "../src/rules";
import { simulate } from "../src/simulate";

const assets: AssetManifest = { bg: { src: "backgrounds/bg.webp", w: 900, h: 1600 } };
const broken = (patch: (w: WorldInput) => void) => {
  const w = structuredClone(miniWorld) as WorldInput;
  patch(w);
  return WorldSchema.parse(w);
};
const messages = (issues: { where: string; message: string }[]) => issues.map((i) => `${i.where}: ${i.message}`).join("\n");

describe("validator rules", () => {
  test("mini world has no errors", () => {
    expect(runRules(miniWorld, assets).filter((i) => i.level === "error")).toEqual([]);
  });

  test("notebook: unique ids, profile-only unlocks, life placeholders", () => {
    const nb = (pages: object[], states = { fake: "{label_fake}", empty: "x", real: "{label_real}" }, footerWhen: string[] = []) => broken((w) => {
      w.notebook = { life: { title: "t", intro: "i", states, footer: { when: footerWhen, text: "f" } }, pages: pages as never };
    });
    expect(messages(rules["notebook"]!(nb([], undefined, ["heat >= 1"]), assets))).toMatch(/life.footer: when uses run quality heat/);
    expect(messages(rules["notebook"]!(nb([{ id: "p", title: "t", text: "x", rule: "r", when: ["trust >= 1"] }]), assets))).toBe("");
    expect(messages(rules["notebook"]!(nb([{ id: "p", title: "t", text: "x", rule: "r", when: ["heat >= 1"] }]), assets))).toMatch(/run quality heat/);
    expect(messages(rules["notebook"]!(nb([{ id: "p", title: "t", text: "x", rule: "r" }, { id: "p", title: "t", text: "x", rule: "r" }]), assets))).toMatch(/duplicate page id/);
    expect(messages(rules["notebook"]!(nb([], { fake: "{trust}", empty: "x", real: "y" }), assets))).toMatch(/unknown placeholder \{trust\}/);
    const ghost = nb([{ id: "p", title: "t", text: "heat {ghost}", rule: "r", when: ["phantom >= 1"] }]);
    expect(messages(rules["qualities"]!(ghost, assets))).toMatch(/notebook page p: condition uses undeclared quality: phantom/);
    expect(messages(rules["placeholders"]!(ghost, assets))).toMatch(/notebook page p text: placeholder \{ghost\}/);
  });

  test("memories: a world with pairs must declare returned_tonight and memories_returned", () => {
    const w = broken((w) => { w.qualities = w.qualities.filter((q) => q.id !== "returned_tonight" && q.id !== "memories_returned"); });
    const out = messages(rules["memories"]!(w, assets));
    expect(out).toMatch(/engine writes returned_tonight on pledge/);
    expect(out).toMatch(/engine writes memories_returned on pledge/);
  });

  test("self-exclusion: a question that retires its own card while siblings stay is a warning; one-shot cards and intros are not", () => {
    const card = (choices: object[], intro = false) => broken((w) => {
      w.storylets.push({ id: "q", location: "hall", priority: 9, when: ["seen.q == 0"], intro, background: "bg", text: "q", choices: choices as never });
    });
    const mixed = card([{ text: "ask", effects: ["seen.q = 1"] }, { text: "ask more", effects: ["heat += 1"] }, { text: "leave", goto: "room" }]);
    expect(messages(rules["self-exclusion"]!(mixed, assets))).toMatch(/storylet q choice #0: effect "seen.q = 1" retires the card/);
    const oneShot = card([{ text: "a", effects: ["seen.q = 1"] }, { text: "b", effects: ["seen.q = 1", "heat += 1"] }, { text: "leave", goto: "room" }]);
    expect(messages(rules["self-exclusion"]!(oneShot, assets))).toBe("");
    const exiting = card([{ text: "ask", effects: ["heat += 1"] }, { text: "leave", effects: ["seen.q = 1"], goto: "room" }]);
    expect(messages(rules["self-exclusion"]!(exiting, assets))).toBe("");
    expect(messages(rules["self-exclusion"]!(card([{ text: "ask", effects: ["seen.q = 1"] }, { text: "ask more" }], true), assets))).toBe("");
    // bounds: `heat = 9` certainly breaks `heat < 5`; `heat += 1` is not certain and stays quiet
    const bound = broken((w) => { w.storylets.push({ id: "b", location: "hall", when: ["heat < 5"], background: "bg", text: "b", choices: [{ text: "x", effects: ["heat = 9"] }, { text: "y", effects: ["heat += 1"] }] as never }); });
    expect(messages(rules["self-exclusion"]!(bound, assets))).toMatch(/storylet b choice #0/);
    expect(messages(rules["self-exclusion"]!(bound, assets))).not.toMatch(/choice #1/);
  });

  test("qualities: undeclared quality in effect and rules", () => {
    const w = broken((w) => {
      w.storylets[0]!.choices[0]!.effects = ["ghost += 1"];
      w.rules.interrupts = [{ when: ["phantom >= 1"], goto: "hall" }];
    });
    expect(messages(rules["qualities"]!(w, assets))).toMatch(/undeclared quality: ghost/);
    expect(messages(rules["qualities"]!(w, assets))).toMatch(/undeclared quality: phantom/);
  });

  test("references: bad goto and missing asset", () => {
    const w = broken((w) => {
      w.storylets[1]!.choices[0]!.goto = "nowhere";
      w.storylets[1]!.background = "missing";
    });
    const out = messages(rules["references"]!(w, assets));
    expect(out).toMatch(/goto unknown location: nowhere/);
    expect(out).toMatch(/unknown background asset: missing/);
  });

  test("dead-ends: location without storylets", () => {
    const w = broken((w) => { w.locations.push({ id: "void" }); });
    expect(messages(rules["dead-ends"]!(w, assets))).toMatch(/location void/);
  });

  test("reachability: location never targeted by goto", () => {
    const w = broken((w) => {
      w.locations.push({ id: "attic" });
      w.storylets.push({ id: "attic_x", location: "attic", background: "bg", text: "x", choices: [{ text: "y" }] });
    });
    expect(messages(rules["reachability"]!(w, assets))).toMatch(/attic.*unreachable/);
  });

  test("report-slots: missing fallback", () => {
    const w = broken((w) => { w.fragments = w.fragments.filter((f) => f.id !== "sum_default"); });
    expect(messages(rules["report-slots"]!(w, assets))).toMatch(/no unconditional fallback/);
  });

  test("layouts: doors need three doors; pledge needs memories and a night pledge", () => {
    const w = broken((w) => { w.storylets[1]!.layout = "doors"; });
    expect(messages(rules["layouts"]!(w, assets))).toMatch(/needs 3 doors \(distinct goto\), has 1/);
    const noMem = broken((w) => { w.memories = []; });
    expect(messages(rules["layouts"]!(noMem, assets))).toMatch(/world.memories is empty/);
    // the night pledge may be conditional (it comes in variants), but something must close the night
    const conditional = broken((w) => { w.storylets.find((s) => s.id === "vault_pledge")!.choices[0]!.when = ["trust < 2"]; });
    expect(messages(rules["layouts"]!(conditional, assets))).toBe("");
    const noNight = broken((w) => { for (const c of w.storylets.find((s) => s.id === "vault_pledge")!.choices) { c.endNight = false; delete c.ending; } });
    expect(messages(rules["layouts"]!(noNight, assets))).toMatch(/closes the night/);
  });

  test("placeholders: unknown quality in text, choice text, outcome or fragment", () => {
    const w = broken((w) => {
      w.storylets[0]!.text = "turn {turn} ghost {ghost}";
      w.storylets[0]!.choices[0]!.outcome = "{also_ghost}";
      w.storylets[0]!.choices[1]!.text = "{Ghost}";
      w.fragments[0]!.text = "{spectre}";
    });
    const out = messages(rules["placeholders"]!(w, assets));
    expect(out).toMatch(/text: placeholder \{ghost\}/);
    expect(out).toMatch(/outcome: placeholder \{also_ghost\}/);
    expect(out).toMatch(/choice #1 text: placeholder \{Ghost\}/);
    expect(out).toMatch(/fragment sum_default: placeholder \{spectre\}/);
    expect(out).not.toMatch(/\{turn\}/);
  });

  test("memories: ids unique, both flags declared and distinct, returnWhen and reserved qualities declared", () => {
    const w = broken((w) => {
      w.memories![0]!.real = "ghost.true";
      w.memories![1]!.returnWhen = ["phantom >= 1"];
      w.memories!.push({ id: "a", fake: "mem.false.a", real: "mem.false.a", label_fake: "x", label_real: "y" });
      w.qualities = w.qualities.filter((q) => q.id !== "returned.*" && q.id !== "memories_returned");
    });
    const out = messages(rules["memories"]!(w, assets));
    expect(out).toMatch(/flag is not a declared quality: ghost.true/);
    expect(out).toMatch(/returnWhen uses undeclared quality: phantom/);
    expect(out).toMatch(/used by more than one pair: mem.false.a/);
    expect(out).toMatch(/fake and real flags are the same/);
    expect(out).toMatch(/duplicate pair id/);
    expect(out).toMatch(/engine writes returned.a on pledge but it is not declared/);
    expect(out).toMatch(/engine writes memories_returned on pledge but it is not declared/);
  });

  test("memories: returnWhen syntax is rejected by the schema", () => {
    const w = structuredClone(miniWorld) as WorldInput;
    w.memories![0]!.returnWhen = ["trust => 1"];
    const r = WorldSchema.safeParse(w);
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path.join(".")).toBe("memories.0.returnWhen.0");
  });

  test("references: interrupt goto must be a location", () => {
    const w = broken((w) => { w.rules.interrupts = [{ when: ["turn >= 1"], goto: "nowhere" }]; });
    expect(messages(rules["references"]!(w, assets))).toMatch(/interrupts #0: goto unknown location: nowhere/);
  });

  test("planned: condition on a quality nothing ever sets is a warning, not an error", () => {
    const w = broken((w) => {
      w.storylets[0]!.when = ["seen.later_floor == 1"];
      w.memories![1]!.returnWhen = ["has.future_item == 1"];
      w.qualities.push({ id: "has.*", scope: "run" });
    });
    const out = rules["planned"]!(w, assets);
    expect(out.every((i) => i.level === "warning")).toBe(true);
    const text = messages(out);
    expect(text).toMatch(/planned: seen.later_floor is never set/);
    expect(text).toMatch(/memory pair b: planned: has.future_item/);
    expect(text).not.toMatch(/mem.false/); // default 1 counts as set
    expect(text).not.toMatch(/returned.a/); // engine-written
    expect(rules["planned"]!(miniWorld, assets)).toEqual([]);
  });

  test("simulation finds no stuck state and covers the mini world", () => {
    const r = simulate(miniWorld, { nights: 100, seed: 1 });
    expect(r.stuck).toEqual([]);
    expect(r.errors).toEqual([]);
    expect(r.neverShown).toEqual([]);
    expect(r.endedByPledge + r.endedByChoice + r.endedByEnding).toBe(100);
    expect(r.endedByPledge).toBeGreaterThan(0);
    expect(r.neverTaken).toEqual([]);
  });
});

describe("evidence rule", () => {
  const ev = (items: unknown[], found = true) => {
    const w = structuredClone(miniWorld) as WorldInput;
    if (found) w.qualities.push({ id: "found.*", scope: "profile" });
    w.evidence = { items: items as never };
    return WorldSchema.parse(w);
  };
  const item = { id: "a", flag: "seen.hall_a", image: "bg", title: "A", text: "a" };

  test("declared flag, known image, unique ids, found.* declared", () => {
    expect(messages(rules["evidence"]!(ev([item]), assets))).toBe("");
    expect(messages(rules["evidence"]!(ev([{ ...item, flag: "nope" }]), assets))).toMatch(/evidence a: flag is not a declared quality: nope/);
    expect(messages(rules["evidence"]!(ev([{ ...item, image: "missing" }]), assets))).toMatch(/unknown image asset: missing/);
    expect(messages(rules["evidence"]!(ev([item, { ...item, flag: "heat" }]), assets))).toMatch(/duplicate evidence id/);
    expect(messages(rules["evidence"]!(ev([item], false), assets))).toMatch(/engine writes found.a on discovery but it is not declared/);
    expect(messages(rules["evidence"]!(ev([], false), assets))).toBe("");
  });

  test("found.* counts as written for the planned rule; rules.clock needs a declared quality", () => {
    const w = ev([item]);
    w.storylets[1]!.when = ["found.a == 1"];
    expect(messages(rules["planned"]!(w, assets))).toBe("");
    const clock = structuredClone(miniWorld) as WorldInput;
    clock.rules.clock = { quality: "nope", start: "22:00", step: 30 };
    expect(messages(rules["qualities"]!(WorldSchema.parse(clock), assets))).toMatch(/rules.clock: undeclared quality: nope/);
  });
});

describe("endings rule", () => {
  const withEnding = (patch: (w: WorldInput) => void) => broken((w) => { patch(w); });

  test("every choice.ending exists, images exist, ids unique, endings.* declared", () => {
    expect(messages(rules["endings"]!(miniWorld, assets))).toBe("");
    expect(messages(rules["endings"]!(withEnding((w) => { w.storylets[4]!.choices[1]!.ending = "nope"; }), assets))).toMatch(/vault_pledge choice #1: unknown ending: nope/);
    expect(messages(rules["endings"]!(withEnding((w) => { w.endings!.endings[0]!.image = "missing"; }), assets))).toMatch(/ending fire: unknown image asset: missing/);
    expect(messages(rules["endings"]!(withEnding((w) => { w.endings!.endings.push({ id: "fire", title: "x", image: "bg", text: "x" }); }), assets))).toMatch(/duplicate ending id/);
    expect(messages(rules["endings"]!(withEnding((w) => { w.qualities = w.qualities.filter((q) => q.id !== "endings.*"); }), assets))).toMatch(/engine writes endings.fire but it is not declared/);
    expect(messages(rules["endings"]!(withEnding((w) => { w.storylets[4]!.choices[1]!.endNight = true; }), assets))).toMatch(/ending and endNight on the same choice/);
    expect(messages(rules["endings"]!(withEnding((w) => { w.endings!.story.opening_slot = "nope"; }), assets))).toMatch(/unknown report slot: nope/);
  });

  test("epilogue conditions and rules.pledgedNightWhen go through the qualities rule; endings.* count as written", () => {
    expect(messages(rules["qualities"]!(withEnding((w) => { w.endings!.endings[0]!.epilogues = [{ when: ["nope == 1"], text: "x" }]; }), assets))).toMatch(/ending fire epilogue #0: condition uses undeclared quality: nope/);
    expect(messages(rules["qualities"]!(withEnding((w) => { w.rules.pledgedNightWhen = ["nope == 1"]; }), assets))).toMatch(/rules.pledgedNightWhen: condition uses undeclared quality: nope/);
    expect(messages(rules["planned"]!(withEnding((w) => { w.storylets[1]!.when = ["endings.fire == 1"]; }), assets))).toBe("");
    expect(messages(rules["placeholders"]!(withEnding((w) => { w.endings!.endings[0]!.text = "{nope}"; }), assets))).toMatch(/ending fire text: placeholder \{nope\}/);
  });

  test("simulation counts games finished by an ending and starts a new case after it", () => {
    const r = simulate(broken((w) => { w.storylets[4]!.choices[1]!.when = []; }), { nights: 60, seed: 3 });
    expect(r.endedByEnding).toBeGreaterThan(0);
    expect(r.stuck).toEqual([]);
    expect(r.errors).toEqual([]);
  });
});

describe("expression syntax is rejected at build time", () => {
  test.each(["turn >> 16", "turn >= sixteen", "turn >= 16 || clues > 1", "process.exit()", "turn >= 1; drop", "Turn >= 1"])(
    "condition %p fails schema",
    (bad) => {
      const w = structuredClone(miniWorld) as WorldInput;
      w.storylets[0]!.when = [bad];
      expect(WorldSchema.safeParse(w).success).toBe(false);
    },
  );
  test.each(["turn ++", "turn = 1 + 1", "turn -= -x", "turn = Math.random()"])("effect %p fails schema", (bad) => {
    const w = structuredClone(miniWorld) as WorldInput;
    w.storylets[0]!.choices[0]!.effects = [bad];
    expect(WorldSchema.safeParse(w).success).toBe(false);
  });
  test("schema failure names the field", () => {
    const w = structuredClone(miniWorld) as WorldInput;
    w.rules.interrupts = [{ when: ["turn >= 16 && clues > 0"], goto: "hall" }];
    const r = WorldSchema.safeParse(w);
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path.join(".")).toBe("rules.interrupts.0.when.0");
  });
});
