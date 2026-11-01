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

  test("qualities: undeclared quality in effect and rules", () => {
    const w = broken((w) => {
      w.storylets[0]!.choices[0]!.effects = ["ghost += 1"];
      w.rules.nightEndWhen = ["phantom >= 1"];
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

  test("doors: needs three choices with goto", () => {
    const w = broken((w) => { w.storylets[1]!.layout = "doors"; });
    expect(messages(rules["doors"]!(w, assets))).toMatch(/needs 3 choices/);
  });

  test("simulation finds no stuck state and covers the mini world", () => {
    const r = simulate(miniWorld, { nights: 100, seed: 1 });
    expect(r.stuck).toEqual([]);
    expect(r.errors).toEqual([]);
    expect(r.neverShown).toEqual([]);
    expect(r.endedByRule + r.endedByChoice).toBe(100);
  });
});
