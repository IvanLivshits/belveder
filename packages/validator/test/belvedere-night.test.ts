/** Scenario runs on the real Belvedere content. Golden digests live in test/golden/.
 *  If content changes on purpose: UPDATE_GOLDEN=1 bun test, explain in the commit. */
import { describe, expect, test } from "bun:test";
import {
  choose, continueOutcome, currentReport, currentScene, emptyProfile, getQuality, newNight, pledge, profileOf,
  type GameState, type Profile,
} from "@belvedere/engine";
import { expectGolden } from "../../engine/test/golden-helper";
import { loadWorldDir } from "../src/load";

const DIR = import.meta.dir;
const world = await loadWorldDir(`${DIR}/../../../content/belvedere`);

/** A string picks the first available choice with that text, "next" leaves an outcome screen,
 *  ["pledge", id] pawns a memory pair. */
type Step = string | ["pledge", string];

function pick(s: GameState, text: string): GameState {
  if (text === "next") return continueOutcome(s, world);
  const scene = currentScene(s, world);
  const c = scene.choices.find((c) => c.available && c.text === text);
  if (!c) throw new Error(`no choice "${text}" in ${scene.storylet.id}; have: ${scene.choices.map((c) => `${c.available ? "" : "x"}${c.text}`).join(" | ")}`);
  return choose(s, world, c.index);
}

function play(profile: Profile, seed: number, plan: Step[]): GameState {
  let s = newNight(profile, world, seed);
  for (const step of plan) s = typeof step === "string" ? pick(s, step) : pledge(s, world, step[1]);
  return s;
}

const q = (s: GameState, id: string) => getQuality(s, world, id);

// From the task: office -> facade -> lobby (cigarette) -> stairs -> 2 -> 3 -> service door -> search the bed
// -> down (Eddie intercepts at turn >= 3, let him go) -> Dolly -> pledge -> pawn the marines memory.
const PLAN_RING: Step[] = [
  "Взять деньги и дело", "Войти через парадную",
  "Предложить сигарету", "next", "К лестнице",
  "Лестница", "Вверх, на второй", "Лестница", "Вверх, на третий",
  "Служебная дверь", "Обыскать кровать", "next", "Уйти",
  "Лестница", "Отпустить", "next", "Вниз, на второй", "Лестница", "Вниз, в вестибюль",
  "Долли", "Оставить залог и выйти",
  ["pledge", "ring"],
];

describe("belvedere: the ring", () => {
  test("pawning the marines memory returns the ring and shapes the report", async () => {
    const s = play(emptyProfile(), 2024, PLAN_RING);
    expect(s.phase).toBe("report");
    expect(q(s, "mem.false.marines")).toBe(0);
    expect(q(s, "mem.true.ring")).toBe(1);
    expect(q(s, "memories_returned")).toBe(1);
    expect(q(s, "pledged.ring")).toBe(1);
    expect(q(s, "returned.ring")).toBe(1);
    expect(q(s, "nights")).toBe(1);
    const report = Object.fromEntries(currentReport(s, world).map((r) => [r.slot, r.fragment.id]));
    expect(report["twist"]).toBe("twist_ring_returned");
    expect(report["finding"]).toBe("finding_ring");
    expect(report["price"]).toBe("price_marines");
    expect(report["entry"]).toBe("entry_cig");
    expect(report["witnesses"]).toBe("witnesses_eddie");
    await expectGolden(DIR, "night-ring-2024", s);
  });

  test("next night opens office_ring and the marines memory is no longer pawnable", () => {
    const first = play(emptyProfile(), 2024, PLAN_RING);
    let n = newNight(profileOf(first), world, 7);
    expect(n.storyletId).toBe("office_ring");
    expect(n.run).toEqual({});
    // dolly_trust is 1, so the wary Dolly greets Nick; her silent exit has no outcome screen
    n = play(profileOf(first), 7, ["Взять деньги и дело", "Войти через парадную", "Молча пойти к лестнице", "Долли", "Оставить залог и выйти"]);
    expect(currentScene(n, world).memories.map((m) => m.id)).not.toContain("ring");
    expect(currentScene(n, world).memories.length).toBe(7);
  });

  test("pledging the night keeps memories and marks the report", () => {
    const s = play(emptyProfile(), 2024, [...PLAN_RING.slice(0, -1), "Заложить эту ночь", "next"]);
    expect(s.phase).toBe("report");
    expect(q(s, "night_pledged")).toBe(1);
    expect(q(s, "mem.false.marines")).toBe(1);
    expect(q(s, "memories_returned")).toBe(0);
    expect(currentReport(s, world).find((r) => r.slot === "price")?.fragment.id).toBe("price_night");
  });
});

describe("belvedere: dawn", () => {
  test("walking the stairs until turn 16 lands on pledge_dawn", async () => {
    let s = play(emptyProfile(), 11, ["Взять деньги и дело", "Войти через парадную", "Молча пойти к лестнице", "next", "Лестница"]);
    let guard = 0;
    while (q(s, "turn") < 16 && guard++ < 60) {
      const scene = currentScene(s, world);
      if (s.phase === "outcome") { s = continueOutcome(s, world); continue; }
      if (scene.storylet.id === "stairs_eddie") { s = pick(s, "Отпустить"); continue; }
      if (scene.storylet.id === "stairs") {
        const floor = q(s, "floor");
        s = pick(s, floor < 4 ? ["", "Вверх, на второй", "Вверх, на третий", "Вверх, на четвёртый"][floor]! : "Вниз, на третий");
        continue;
      }
      s = pick(s, "Лестница"); // back from a landing to the stairwell
    }
    if (s.phase === "outcome") s = continueOutcome(s, world);
    expect(q(s, "turn")).toBe(16);
    expect(s.phase).toBe("scene");
    expect(s.location).toBe("pledge");
    expect(s.storyletId).toBe("pledge_dawn");
    expect(currentScene(s, world).memories.length).toBe(8);
    await expectGolden(DIR, "night-dawn-11", s);
  });

  test("same seed and plan are reproducible", () => {
    expect(play(emptyProfile(), 2024, PLAN_RING)).toEqual(play(emptyProfile(), 2024, PLAN_RING));
  });
});
