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

  test("layouts: doors need three choices; pledge needs memories and a night pledge", () => {
    const w = broken((w) => { w.storylets[1]!.layout = "doors"; });
    expect(messages(rules["layouts"]!(w, assets))).toMatch(/needs 3 choices/);
    const noMem = broken((w) => { w.memories = []; });
    expect(messages(rules["layouts"]!(noMem, assets))).toMatch(/world.memories is empty/);
    const noNight = broken((w) => { w.storylets.find((s) => s.id === "vault_pledge")!.choices[0]!.endNight = false; });
    expect(messages(rules["layouts"]!(noNight, assets))).toMatch(/unconditional endNight choice/);
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

  test("memories: both flags declared, distinct, returnWhen uses declared qualities", () => {
    const w = broken((w) => {
      w.memories![0]!.true = "ghost.true";
      w.memories![1]!.returnWhen = ["phantom >= 1"];
      w.memories!.push({ false: "mem.false.a", true: "mem.false.a", label_false: "x", label_true: "y" });
    });
    const out = messages(rules["memories"]!(w, assets));
    expect(out).toMatch(/flag is not a declared quality: ghost.true/);
    expect(out).toMatch(/returnWhen uses undeclared quality: phantom/);
    expect(out).toMatch(/used by more than one pair: mem.false.a/);
    expect(out).toMatch(/false and true flags are the same/);
  });

  test("memories: returnWhen syntax is rejected by the schema", () => {
    const w = structuredClone(miniWorld) as WorldInput;
    w.memories![0]!.returnWhen = ["trust => 1"];
    const r = WorldSchema.safeParse(w);
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path.join(".")).toBe("memories.0.returnWhen.0");
  });

  test("simulation finds no stuck state and covers the mini world", () => {
    const r = simulate(miniWorld, { nights: 100, seed: 1 });
    expect(r.stuck).toEqual([]);
    expect(r.errors).toEqual([]);
    expect(r.neverShown).toEqual([]);
    expect(r.endedByRule + r.endedByChoice).toBe(100);
    expect(r.neverTaken).toEqual([]);
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
    w.rules.nightEndWhen = ["turn >= 16 && clues > 0"];
    const r = WorldSchema.safeParse(w);
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path.join(".")).toBe("rules.nightEndWhen.0");
  });
});
