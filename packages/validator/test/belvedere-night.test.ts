/** Scenario runs on the real Belvedere content. Golden digests live in test/golden/.
 *  If content changes on purpose: UPDATE_GOLDEN=1 bun test, explain in the commit. */
import { describe, expect, test } from "bun:test";
import {
  choiceCost, choose, continueOutcome, currentNotes, currentReport, currentScene, emptyProfile, getQuality, newNight, notebookView, pledge, pledgeOptions, profileOf,
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

// From the task: office -> facade -> lobby (Dolly's rules, then a cigarette) -> stairs -> 2 -> 3 -> service door
// -> search the bed -> down (Eddie intercepts at turn >= 3, let him go) -> Dolly -> pledge -> pawn the marines memory.
const PLAN_RING: Step[] = [
  "Взять деньги и дело", "Войти через парадную",
  "Кивнуть", "Предложить сигарету", "next", "К лестнице",
  "Лестница", "Вверх, на второй", "Лестница", "Вверх, на третий",
  "Служебная дверь", "Обыскать кровать", "next", "Уйти",
  "Лестница", "Отпустить", "next", "Вниз, на второй", "Лестница", "Вниз, в вестибюль",
  "Долли", "Оставить залог и выйти",
  ["pledge", "ring"],
];

// The tutorial route from the task: every first-night card on the way to the ring.
const PLAN_FIRST_NIGHT: Step[] = [
  "Спросить, что это за дом", "next", "Взять деньги и дело",
  "Поднять газету", "next", "Войти через парадную",
  "Спросить, как её зовут", "next", "Спросить, где он ночевал", "next", "К лестнице",
  "Лестница", "Вверх, на второй", "Лестница", "Вверх, на третий",
  "Служебная дверь", "Обыскать кровать", "next", "Уйти",
  "Лестница", "Отпустить", "next", "Вниз, на второй", "Лестница", "Вниз, в вестибюль",
  "Долли", "Оставить залог и выйти",
];

/** Walks the stairs up and down until the turn limit; landings and the lobby hub lead back to the stairwell. */
function walkUntilDawn(start: GameState): GameState {
  let s = start;
  let guard = 0;
  while (q(s, "turn") < 16 && guard++ < 80) {
    if (s.phase === "outcome") { s = continueOutcome(s, world); continue; }
    const id = currentScene(s, world).storylet.id;
    if (id === "stairs_eddie") { s = pick(s, "Отпустить"); continue; }
    if (id === "lobby_hub") { s = pick(s, "К лестнице"); continue; }
    if (id === "stairs") {
      const floor = q(s, "floor");
      s = pick(s, floor < 4 ? ["", "Вверх, на второй", "Вверх, на третий", "Вверх, на четвёртый"][floor]! : "Вниз, на третий");
      continue;
    }
    s = pick(s, "Лестница"); // back from a landing to the stairwell
  }
  return s.phase === "outcome" ? continueOutcome(s, world) : s;
}

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

describe("belvedere: first night", () => {
  test("tutorial route: Dolly's first pledge screen, only the ring can return, notes on the report", async () => {
    let s = play(emptyProfile(), 5, PLAN_FIRST_NIGHT);
    expect(s.storyletId).toBe("pledge_first_night");
    expect(pledgeOptions(s, world).filter((o) => o.canReturn).map((o) => o.id)).toEqual(["ring"]);
    expect(currentScene(s, world).memories.find((m) => m.id === "ring")?.canReturn).toBe(true);
    s = pledge(s, world, "ring");
    expect(s.phase).toBe("report");
    expect(q(s, "memories_returned")).toBe(1);
    expect(currentNotes(s, world)).toEqual(["Это отчёт Ника за ночь. Из таких страниц сложится дело Хейла, и у каждого игрока оно своё."]);
    await expectGolden(DIR, "night-first-5", s);

    // Second night: the tutorial cards are gone, the notebook shows the returned ring and the new page.
    let n = newNight(profileOf(s), world, 8);
    expect(n.storyletId).toBe("office_ring");
    n = pick(n, "Взять деньги и дело");
    expect(n.storyletId).not.toBe("facade_first_night");
    n = pick(n, "Войти через парадную");
    expect(n.storyletId).not.toBe("lobby_rules");
    expect(n.storyletId).not.toBe("lobby_first_night");
    const nb = notebookView(n, world)!;
    expect(nb.life.lines.find((l) => l.pair === "ring")).toEqual({ pair: "ring", status: "real", text: "~~Морская пехота, Тихий океан~~ → Кольцо: свадьба на Канал-стрит" });
    expect(nb.life.lines.filter((l) => l.status === "fake").length).toBe(7);
    expect(nb.pages.map((p) => p.id)).toContain("new_tenants");
    expect(nb.pages.map((p) => p.id)).not.toContain("eddie");
    expect(currentNotes(n, world)).toEqual([]);
  });

  test("dawn on the first night shows pledge_first_night, not pledge_dawn", () => {
    const s = walkUntilDawn(play(emptyProfile(), 11, ["Взять деньги и дело", "Войти через парадную", "Кивнуть", "Спросить, где он ночевал", "next", "К лестнице", "Лестница"]));
    expect(q(s, "turn")).toBe(16);
    expect(s.location).toBe("pledge");
    expect(s.storyletId).toBe("pledge_first_night");
  });

  test("choice cost: free 0, plain 1, a long talk 2", () => {
    const s = newNight(emptyProfile(), world, 1);
    const office = currentScene(s, world);
    expect(office.choices.map((c) => choiceCost(s, world, c.choice))).toEqual([0, 0, 0, 0]);
    const meal = world.storylets.flatMap((st) => st.choices).find((c) => c.text === "Сесть и поесть")!;
    expect(choiceCost(s, world, meal)).toBe(2);
    const stairs = world.storylets.find((st) => st.id === "stairs")!.choices[0]!;
    expect(choiceCost(s, world, stairs)).toBe(1);
  });
});

describe("belvedere: dawn", () => {
  test("on a later night, walking the stairs until turn 16 lands on pledge_dawn", async () => {
    const first = play(emptyProfile(), 2024, PLAN_RING);
    // dolly_trust is 1 after the ring night, so the wary Dolly lets Nick pass in silence
    let s = play(profileOf(first), 11, ["Взять деньги и дело", "Войти через парадную", "Молча пойти к лестнице", "Лестница"]);
    s = walkUntilDawn(s);
    expect(q(s, "turn")).toBe(16);
    expect(s.phase).toBe("scene");
    expect(s.location).toBe("pledge");
    expect(s.storyletId).toBe("pledge_dawn");
    expect(currentScene(s, world).memories.length).toBe(7);
    await expectGolden(DIR, "night-dawn-11", s);
  });

  test("same seed and plan are reproducible", () => {
    expect(play(emptyProfile(), 2024, PLAN_RING)).toEqual(play(emptyProfile(), 2024, PLAN_RING));
  });
});
