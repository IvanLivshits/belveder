/** Validator rules of the night loop v2 (lines, rumors, leads, vouchers, stairs) on the engine's tower world. */
import { describe, expect, test } from "bun:test";
import { WorldSchema, type AssetManifest, type WorldInput } from "@belvedere/content-schema";
import { tower, towerInput, towerVariant } from "../../engine/test/tower-world";
import { rules, runRules } from "../src/rules";
import { wordCount } from "../src/rules/lines";
import { simulate } from "../src/simulate";

const assets: AssetManifest = { bg: { src: "backgrounds/bg.webp", w: 900, h: 1600 } };
const out = (rule: string, patch: (w: WorldInput) => void) => rules[rule]!(towerVariant(patch), assets).map((i) => `${i.level} ${i.where}: ${i.message}`).join("\n");
const words = (n: number) => Array.from({ length: n }, () => "слово").join(" ");

describe("night loop v2 rules", () => {
  test("the tower world is clean: no errors, one planned warning for the pass nobody hands out", () => {
    expect(runRules(tower, assets).map((i) => `${i.level} ${i.where}: ${i.message}`)).toEqual([
      "warning stairs.locks #0: planned: has.pass is never set by any effect, so this condition cannot change",
    ]);
  });

  test("lines: an unknown speaker and a choice without say, do or text are errors", () => {
    expect(out("lines", (w) => { w.storylets[0]!.lines![1]!.who = "bob"; })).toMatch(/error storylet lobby_hi line #1: unknown speaker: bob/);
    expect(out("lines", (w) => { w.storylets[0]!.choices[0]!.reply![0]!.who = "bob"; })).toMatch(/error storylet lobby_hi choice #0 reply #0: unknown speaker: bob/);
    expect(out("lines", (w) => { delete w.storylets[0]!.choices[1]!.do; })).toMatch(/error storylet lobby_hi choice #1: a choice needs one of say, do, text/);
    expect(out("lines", () => {})).toBe("");
  });

  test("lines: the authors' limits are warnings", () => {
    expect(wordCount("«12 — выкупить до 15-го» — и всё.")).toBe(6); // a lone dash is not a word
    const text = (who: string, n: number) => out("lines", (w) => { w.storylets[0]!.lines![0] = { who, text: words(n) }; });
    expect(text("narrator", 25)).toBe("");
    expect(text("narrator", 26)).toMatch(/warning storylet lobby_hi line #0: the narrator's line is 26 words long \(limit 25\)/);
    expect(text("ann", 30)).toBe("");
    expect(text("ann", 31)).toMatch(/a character's line is 31 words long \(limit 30\)/);
    expect(text("gut", 15)).toBe("");
    expect(text("gut", 16)).toMatch(/the inner's line is 16 words long \(limit 15\)/);
    const line = { who: "narrator", text: "x" };
    expect(out("lines", (w) => { w.storylets[0]!.lines = [line, line, line, line]; })).toBe("");
    expect(out("lines", (w) => { w.storylets[0]!.lines = [line, line, line, line, line]; })).toMatch(/warning storylet lobby_hi line: 5 lines before the choices \(limit 4\)/);
    expect(out("lines", (w) => { w.storylets[0]!.choices[0]!.reply = [line, line, line, line]; })).toMatch(/choice #0 reply: 4 lines in a reply \(limit 3\)/);
    expect(out("lines", (w) => { w.storylets[0]!.choices[0]!.say = words(9); })).toMatch(/choice #0: say is 9 words long \(limit 8\)/);
    expect(out("lines", (w) => { w.storylets[0]!.choices[1]!.do = words(8); })).toBe("");
    // many choices: only a card of lines where something stays on the card; a menu of exits and an old text card are let be
    const many = (w: WorldInput, id: string) => { const s = w.storylets.find((x) => x.id === id)!; while (s.choices.length < 9) s.choices.push({ text: "more", goto: "lobby" }); };
    expect(out("lines", (w) => many(w, "room_in"))).toMatch(/warning storylet room_in: many choices: 9 \(limit 8/);
    expect(out("lines", (w) => many(w, "f1_landing"))).toBe("");
    expect(out("lines", (w) => many(w, "f3_old"))).toBe("");
  });

  test("rumors: unique ids, rumor.* declared, firstNightRumor known, conditions and texts checked", () => {
    expect(out("rumors", (w) => { w.rumors!.push({ id: "pie", text: "again" }); })).toMatch(/rumor pie: duplicate rumor id/);
    expect(out("rumors", (w) => { w.qualities = w.qualities.filter((q) => q.id !== "rumor.*"); })).toMatch(/engine writes rumor.pie when the night starts but it is not declared/);
    expect(out("rumors", (w) => { w.rules.firstNightRumor = "ghost"; })).toMatch(/rules.firstNightRumor: unknown rumor: ghost/);
    expect(out("qualities", (w) => { w.rumors![2]!.when = ["phantom == 1"]; })).toMatch(/rumor late: condition uses undeclared quality: phantom/);
    expect(out("placeholders", (w) => { w.rumors![0]!.text = "{ghost}"; })).toMatch(/rumor pie: placeholder \{ghost\}/);
    // the rumor flag counts as set by the engine
    expect(out("planned", (w) => { w.storylets[0]!.when = ["rumor.dark == 0"]; })).not.toMatch(/rumor.dark/);
  });

  test("leads and vouchers: declared profile qualities, unique ids, a known target", () => {
    expect(out("qualities", (w) => { w.notebook!.leads![0]!.done = ["phantom == 1"]; })).toMatch(/lead ann done: condition uses undeclared quality: phantom/);
    expect(out("qualities", (w) => { w.notebook!.leads![1]!.when = ["phantom == 1"]; })).toMatch(/lead room: condition uses undeclared quality: phantom/);
    expect(out("qualities", (w) => { w.notebook!.vouchers!.names = { "ghost.x": "X" }; })).toMatch(/notebook vouchers.names: undeclared quality: ghost.x/);
    expect(out("references", (w) => { w.notebook!.leads![0]!.target = "attic"; })).toMatch(/lead ann: target is an unknown location: attic/);
    expect(out("notebook", (w) => { w.notebook!.leads![0]!.done = ["has.key == 1"]; })).toMatch(/lead ann: when uses run quality has.key/);
    expect(out("notebook", (w) => { w.notebook!.leads![1]!.id = "ann"; })).toMatch(/lead ann: duplicate lead id/);
    expect(out("notebook", (w) => { w.notebook!.vouchers!.when = ["turn >= 1"]; })).toMatch(/notebook vouchers: when uses run quality turn/);
    expect(out("notebook", (w) => { w.notebook!.vouchers!.names = { "has.key": "Key" }; })).toMatch(/vouchers.names: when uses run quality has.key/);
    expect(out("placeholders", (w) => { w.notebook!.leads![0]!.answer = "{ghost}"; })).toMatch(/lead ann answer: placeholder \{ghost\}/);
    expect(out("notebook", () => {})).toBe("");
  });

  test("progress lines may use the engine's counters besides qualities", () => {
    expect(out("placeholders", () => {})).toBe("");
    expect(out("placeholders", (w) => { w.report.progress = [{ text: "{leads_done} {leads_total} {leads_open}" }]; })).toMatch(/report progress #0: placeholder \{leads_open\}/);
    expect(out("placeholders", (w) => { w.report.notes = [{ text: "{leads_done}" }]; })).toMatch(/report note #0: placeholder \{leads_done\}/);
    expect(out("qualities", (w) => { w.report.progress = [{ when: ["phantom == 1"], text: "x" }]; })).toMatch(/report progress #0: condition uses undeclared quality: phantom/);
  });

  test("stairs: declared quality and conditions, known locations and floors, the layout in its place, floors only on encounters", () => {
    expect(out("qualities", (w) => { w.stairs!.quality = "storey"; })).toMatch(/stairs.quality: undeclared quality: storey/);
    expect(out("qualities", (w) => { w.stairs!.costMods = [{ when: ["phantom == 1"], add: 1 }]; })).toMatch(/stairs.costMods #0: condition uses undeclared quality: phantom/);
    expect(out("qualities", (w) => { w.stairs!.locks![0]!.open_any = [["phantom == 1"]]; })).toMatch(/stairs.locks #0: condition uses undeclared quality: phantom/);
    expect(out("qualities", (w) => { w.stairs!.onTravel = ["phantom = 1"]; })).toMatch(/stairs.onTravel: effect uses undeclared quality: phantom/);
    expect(out("qualities", (w) => { w.rules.onNightStart = ["phantom = 1"]; })).toMatch(/rules.onNightStart: effect uses undeclared quality: phantom/);
    expect(out("qualities", (w) => { w.rules.migrations = [{ when: ["phantom == 1"], effects: ["spectre = 1"] }]; })).toMatch(/rules.migrations #0: condition uses undeclared quality: phantom\n.*rules.migrations #0: effect uses undeclared quality: spectre/);
    expect(out("qualities", (w) => { w.storylets[0]!.lines![2]!.when = ["phantom == 1"]; })).toMatch(/storylet lobby_hi line #2: condition uses undeclared quality: phantom/);
    expect(out("references", (w) => { w.stairs!.floors = { ...w.stairs!.floors, 6: "attic" }; })).toMatch(/stairs.floors.6: unknown location: attic/);
    expect(out("references", (w) => { w.stairs!.events = "attic"; })).toMatch(/stairs.events: unknown location: attic/);
    expect(out("references", (w) => { w.stairs!.locks![0]!.floor = 7; })).toMatch(/stairs.locks #0: unknown floor: 7/);
    expect(out("layouts", (w) => { w.storylets.find((s) => s.id === "stairs")!.location = "lobby"; })).toMatch(/storylet stairs: stairs layout outside stairs.location \(stairwell\)/);
    expect(out("layouts", (w) => { delete w.stairs; })).toMatch(/storylet stairs: stairs layout but the world has no stairs/);
    expect(out("layouts", (w) => { w.storylets[0]!.floors = [1, 2]; })).toMatch(/storylet lobby_hi: floors is only for encounters on the stairs/);
    // four choices are still three doors while two of them share a goto; a fourth goto is one door too many
    expect(out("layouts", () => {})).toBe("");
    expect(out("layouts", (w) => { w.storylets.find((s) => s.id === "f2_doors")!.choices[1]!.goto = "f1"; })).toMatch(/storylet f2_doors: doors layout needs 3 doors \(distinct goto\), has 4/);
  });

  test("stairs: the screen needs no choices of its own and makes every landing and encounter reachable", () => {
    expect(out("dead-ends", () => {})).toBe("");
    expect(out("reachability", () => {})).toBe("");
    expect(out("reachability", (w) => { w.locations.push({ id: "attic" }); w.storylets.push({ id: "attic_x", location: "attic", background: "bg", text: "x", choices: [{ text: "y" }] }); })).toMatch(/location attic: unreachable/);
    // only a stairs card may be empty
    const w = structuredClone(towerInput);
    w.storylets[0]!.choices = [];
    const r = WorldSchema.safeParse(w);
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.message).toBe("only a stairs layout may have no choices");
    const noText = structuredClone(towerInput);
    delete noText.storylets[0]!.lines;
    expect(WorldSchema.safeParse(noText).error!.issues[0]!.message).toBe("a storylet needs lines or text");
    const both = structuredClone(towerInput);
    both.storylets[0]!.lines![1] = { who: "ann", rumor: true, text: "both" };
    expect(WorldSchema.safeParse(both).error!.issues[0]!.message).toBe("a line needs either text or rumor: true");
  });

  test("the simulation walks the stairs: no stuck state, every card and encounter is seen", () => {
    const r = simulate(tower, { nights: 300, seed: 2 });
    expect(r.stuck).toEqual([]);
    expect(r.errors).toEqual([]);
    expect(r.neverShown).toEqual([]);
    expect(r.endedByChoice).toBe(300);
  });
});
