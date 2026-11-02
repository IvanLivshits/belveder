/** Scenario runs on the real Belvedere content. Golden digests live in test/golden/.
 *  If content changes on purpose: UPDATE_GOLDEN=1 bun test, explain in the commit. */
import { describe, expect, test } from "bun:test";
import {
  choiceCost, choose, clockTime, continueOutcome, currentNotes, currentReport, currentScene, emptyProfile, evidenceView, getQuality, morningNotes, newNight, notebookView, pledge, pledgeOptions, profileOf,
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

/** Like play(), but outcome screens are skipped automatically and Eddie on the stairs is let go. */
function route(start: GameState, steps: string[]): GameState {
  let s = start;
  for (const text of steps) {
    if (s.phase === "outcome") s = continueOutcome(s, world);
    const id = currentScene(s, world).storylet.id;
    if (id === "stairs_eddie" || id === "stairs_eddie_again") { s = pick(s, "Отпустить"); if (s.phase === "outcome") s = continueOutcome(s, world); }
    s = pick(s, text);
  }
  return s.phase === "outcome" ? continueOutcome(s, world) : s;
}

const TO_FLOOR_4 = [
  "Открыть", "Взять деньги и дело", "Войти через парадную", "Кивнуть", "Спросить, где он ночевал", "К лестнице",
  "Лестница", "Вверх, на второй", "Лестница", "Вверх, на третий", "Лестница", "Вверх, на четвёртый",
];

// From the task: office -> facade -> lobby (Dolly's rules, then a cigarette) -> stairs -> 2 -> 3 -> service door
// -> search the bed -> down (Eddie intercepts at turn >= 3, let him go) -> Dolly -> pledge -> pawn the marines memory.
const PLAN_RING: Step[] = [
  "Открыть", "Взять деньги и дело", "Войти через парадную",
  "Кивнуть", "Предложить сигарету", "next", "К лестнице",
  "Лестница", "Вверх, на второй", "Лестница", "Вверх, на третий",
  "Служебная дверь", "Перебрать коробку", "next", "Уйти",
  "Лестница", "Отпустить", "next", "Вниз, на второй", "Лестница", "Вниз, в вестибюль",
  "Долли", "Уйти до рассвета (залог)",
  ["pledge", "ring"],
];

// The tutorial route from the task: every first-night card on the way to the ring.
const PLAN_FIRST_NIGHT: Step[] = [
  "Открыть", "Спросить, что это за дом", "next", "Взять деньги и дело",
  "Поднять газету", "next", "Войти через парадную",
  "Спросить, давно ли она здесь", "next", "Спросить, где он ночевал", "next", "К лестнице",
  "Лестница", "Вверх, на второй", "Лестница", "Вверх, на третий",
  "Служебная дверь", "Перебрать коробку", "next", "Уйти",
  "Лестница", "Отпустить", "next", "Вниз, на второй", "Лестница", "Вниз, в вестибюль",
  "Долли", "Уйти до рассвета (залог)",
];

/** Any night after the first: office -> facade -> wary Dolly -> pledge. */
const PLAN_QUICK_EXIT: Step[] = ["Взять деньги и дело", "Войти через парадную", "Молча пойти к лестнице", "Долли", "Уйти до рассвета (залог)"];

/** Stairwell labels by target floor, for climbing one flight at a time from a landing. */
const UP = ["", "", "Вверх, на второй", "Вверх, на третий", "Вверх, на четвёртый", "Вверх, на пятый", "Вверх, на шестой", "Вверх, на седьмой", "Вверх, на восьмой"];
const DOWN = ["", "Вниз, в вестибюль", "Вниз, на второй", "Вниз, на третий", "Вниз, на четвёртый", "Вниз, на пятый", "Вниз, на шестой", "Вниз, на седьмой"];

/** Walks the stairs up and down until the turn limit; landings and the lobby hub lead back to the stairwell. */
function walkUntilDawn(start: GameState): GameState {
  let s = start;
  let guard = 0;
  while (q(s, "turn") < 16 && guard++ < 80) {
    if (s.phase === "outcome") { s = continueOutcome(s, world); continue; }
    const id = currentScene(s, world).storylet.id;
    if (id === "stairs_eddie" || id === "stairs_eddie_again") { s = pick(s, "Отпустить"); continue; }
    if (id === "lobby_hub" || id === "lobby_hub_first_night" || id === "lobby_hub_trusted") { s = pick(s, "К лестнице"); continue; }
    if (id === "stairs" || id === "stairs_upper" || id === "stairs_top") {
      const floor = q(s, "floor");
      s = pick(s, floor < 4 ? UP[floor + 1]! : DOWN[floor - 1]!);
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
    n = play(profileOf(first), 7, PLAN_QUICK_EXIT);
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
  test("the game opens on office_morning with Nick's biography; the notebook starts with five pages", () => {
    const s = newNight(emptyProfile(), world, 1);
    expect(s.storyletId).toBe("office_morning");
    expect(currentScene(s, world).choices.map((c) => c.text)).toEqual(["Открыть"]);
    const nb = notebookView(s, world)!;
    expect(nb.pages.map((p) => p.id)).toEqual(["case", "belvedere", "night", "cigarettes", "clues"]);
    expect(nb.life.footer).toBeNull();
    expect(nb.life.lines.length).toBe(8);
    const after = pick(s, "Открыть");
    expect(after.storyletId).toBe("office_first_night");
    expect(q(after, "turn")).toBe(0);
  });

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
    expect(nb.pages.map((p) => p.id)).toContain("dolly"); // met on the first night
    expect(nb.pages.map((p) => p.id)).toContain("report"); // opens from the second night
    expect(nb.pages.map((p) => p.id)).not.toContain("eddie");
    expect(nb.life.footer).toBe("Почерк в некоторых строках не мой. То есть мой, но другой."); // after the first return
    expect(currentNotes(n, world)).toEqual([]);
  });

  test("dawn on the first night shows pledge_first_dawn, which explains the pledge", () => {
    const s = walkUntilDawn(play(emptyProfile(), 11, ["Открыть", "Взять деньги и дело", "Войти через парадную", "Кивнуть", "Спросить, где он ночевал", "next", "К лестнице", "Лестница"]));
    expect(q(s, "turn")).toBe(16);
    expect(s.location).toBe("pledge");
    expect(s.storyletId).toBe("pledge_first_dawn");
    expect(currentScene(s, world).memories.length).toBe(8);
  });

  test("office_ring opens the second night only, then the office goes back to normal", () => {
    const first = play(emptyProfile(), 2024, PLAN_RING);
    const second = newNight(profileOf(first), world, 7);
    expect(second.storyletId).toBe("office_ring");
    const secondDone = play(profileOf(first), 7, PLAN_QUICK_EXIT);
    expect(q(secondDone, "met.office_ring")).toBe(1);
    const third = newNight(profileOf(play(profileOf(first), 7, [...PLAN_QUICK_EXIT, "Заложить эту ночь", "next"])), world, 8);
    expect(third.storyletId).not.toBe("office_ring");
    expect(third.location).toBe("office");
  });

  test("choice cost: free 0, plain 1, a long talk 2", () => {
    const s = newNight(emptyProfile(), world, 1);
    const office = currentScene(pick(s, "Открыть"), world); // office_first_night: every choice is free
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

describe("belvedere: the rough player", () => {
  test("pressure on Sloan, then breaking into the archive, still leads to the real ledger", () => {
    let s = route(newNight(emptyProfile(), world, 3), [...TO_FLOOR_4, "Кабинет аудитора", "Сесть без приглашения", "Надавить и потребовать книгу"]);
    expect(q(s, "has.ledger_fake")).toBe(1);
    expect(q(s, "has.ledger_true")).toBe(0);
    s = route(s, ["Уйти", "Служебная дверь", "Вскрыть замок"]);
    expect(currentScene(s, world).storylet.id).toBe("archive_shelves");
    const texts = currentScene(s, world).choices.filter((c) => c.available).map((c) => c.text);
    expect(texts).toContain("Сравнить с копией Слоуна");
    expect(texts).not.toContain("Пошарить за стеллажом");
    s = route(s, ["Сравнить с копией Слоуна"]);
    expect(q(s, "has.ledger_true")).toBe(1);
    expect(q(s, "suspicion")).toBe(3); // 1 for the pressure, 2 for the lock
  });

  test("at suspicion 5 a tenant door is shown locked and costs nothing", () => {
    let s = route(newNight(emptyProfile(), world, 3), ["Открыть", "Взять деньги и дело", "Войти через парадную", "Кивнуть", "Спросить, где он ночевал", "К лестнице", "Лестница", "Вверх, на второй"]);
    expect(currentScene(s, world).storylet.id).toBe("floor_02_doors");
    s = { ...s, run: { ...s.run, suspicion: 5 } };
    const scene = currentScene(s, world);
    const laundry = scene.choices.find((c) => c.text === "Прачечная")!;
    expect(laundry.available).toBe(false);
    const turn = q(s, "turn");
    expect(() => choose(s, world, laundry.index)).toThrow(/not available/);
    expect(q(s, "turn")).toBe(turn);
    expect(scene.choices.find((c) => c.text === "Лестница")?.available).toBe(true);
  });

  test("first night without a find: Dolly advises pledging the night", () => {
    const s = route(newNight(emptyProfile(), world, 3), ["Открыть", "Взять деньги и дело", "Войти через парадную", "Кивнуть", "Спросить, где он ночевал", "Уйти до рассвета (залог)"]);
    expect(s.storyletId).toBe("pledge_first_empty");
    expect(pledgeOptions(s, world).some((o) => o.canReturn)).toBe(false);
  });

  test("morning notes: exactly one line for a pledged night, a hole and a return", () => {
    const empty = route(newNight(emptyProfile(), world, 3), ["Открыть", "Взять деньги и дело", "Войти через парадную", "Кивнуть", "Спросить, где он ночевал", "Уйти до рассвета (залог)"]);
    expect(morningNotes(route(empty, ["Заложить эту ночь"]), world)).toEqual(["Вчерашней ночи нет. Список тот же. Почему-то от этого не легче."]);
    expect(morningNotes(pledge(empty, world, "lantern"), world)).toEqual(["Одна строка зачёркнута. На её месте пусто, и пустота ноет, как зуб."]);
    expect(morningNotes(play(emptyProfile(), 2024, PLAN_RING), world)).toEqual(["Одна строка переписана. Ты не помнишь, когда успел."]);
  });

});

describe("belvedere: deep run", () => {
  const RING = () => profileOf(play(emptyProfile(), 2024, PLAN_RING));

  test("regression: asking Vivian about the chapel keeps office_ring on screen and client_ring in the report", () => {
    let n = newNight(RING(), world, 7);
    expect(n.storyletId).toBe("office_ring");
    n = pick(n, "Спросить, где они венчались");
    expect(n.phase).toBe("outcome");
    n = continueOutcome(n, world);
    expect(n.storyletId).toBe("office_ring");
    expect(q(n, "met.office_ring")).toBe(0);
    n = route(n, ["Взять деньги и дело"]);
    expect(q(n, "met.office_ring")).toBe(1);
    n = route(n, ["Войти через парадную", "Молча пойти к лестнице", "Долли", "Уйти до рассвета (залог)", "Заложить эту ночь"]);
    expect(currentReport(n, world).find((r) => r.slot === "client")?.fragment.id).toBe("client_ring");
  });

  test("Eddie on the stairs remembers nothing, but the second night uses stairs_eddie_again", () => {
    const first = play(emptyProfile(), 2024, PLAN_RING);
    expect(first.log.some((e) => e.storylet === "stairs_eddie")).toBe(true);
    expect(q(first, "met.eddie")).toBe(1);
    let n = route(newNight(profileOf(first), world, 7), ["Взять деньги и дело", "Войти через парадную", "Молча пойти к лестнице", "Лестница", "Вверх, на второй", "Лестница", "Вверх, на третий", "Лестница"]);
    expect(currentScene(n, world).storylet.id).toBe("stairs_eddie_again");
  });

  test("Gorman at the car, then suspicion 4 on the stairs: stairs_gorman_again instead of a second introduction", () => {
    const toLanding = (car: boolean) => route(newNight(RING(), world, 7), ["Взять деньги и дело", ...(car ? ["Подойти к машине у фонаря"] : []), "Войти через парадную", "Молча пойти к лестнице"]);
    let withCar = toLanding(true);
    expect(q(withCar, "seen.facade_car")).toBe(1);
    expect(q(withCar, "met.gorman")).toBe(1);
    withCar = pick({ ...withCar, run: { ...withCar.run, suspicion: 4 } }, "Лестница");
    expect(withCar.storyletId).toBe("stairs_gorman_again");
    let noCar = toLanding(false);
    noCar = pick({ ...noCar, run: { ...noCar.run, suspicion: 4 } }, "Лестница");
    expect(noCar.storyletId).toBe("stairs_gorman");
  });

  test("Sloan tells of the missing money, then hands a fake ledger: the report pits the two Sloans against each other", () => {
    let s = route(newNight(emptyProfile(), world, 3), [...TO_FLOOR_4, "Кабинет аудитора", "Сесть без приглашения", "Угостить сигаретой", "Спросить, что связывает его с Хейлом", "Надавить и потребовать книгу"]);
    expect(q(s, "seen.sloan_cashbox")).toBe(1);
    expect(q(s, "has.ledger_fake")).toBe(1);
    s = route(s, ["Уйти", "Лестница", "Вниз, на третий", "Лестница", "Вниз, на второй", "Лестница", "Вниз, в вестибюль", "Долли", "Уйти до рассвета (залог)", "Заложить эту ночь"]);
    const report = Object.fromEntries(currentReport(s, world).map((r) => [r.slot, r.fragment.id]));
    expect(report["finding"]).toBe("finding_ticket");
    expect(report["twist"]).toBe("twist_fake_vs_ticket");
    expect(Object.values(report)).not.toContain("twist_fake_ledger");
  });

  test("office_cashbox opens once after the cashbox memory returns", () => {
    // polite Sloan: a cigarette buys the story of the missing money and the pawn ticket
    let s = route(newNight(emptyProfile(), world, 3), [...TO_FLOOR_4, "Кабинет аудитора", "Сесть без приглашения", "Угостить сигаретой", "Спросить, что связывает его с Хейлом"]);
    expect(q(s, "seen.sloan_cashbox")).toBe(1);
    expect(q(s, "has.pawn_ticket")).toBe(1);
    s = route(s, ["Уйти", "Лестница", "Вниз, на третий", "Лестница", "Вниз, на второй", "Лестница", "Вниз, в вестибюль", "Долли", "Уйти до рассвета (залог)"]);
    expect(pledgeOptions(s, world).filter((o) => o.canReturn).map((o) => o.id)).toEqual(["cashbox"]);
    s = pledge(s, world, "cashbox");
    expect(q(s, "mem.true.cashbox")).toBe(1);
    const second = newNight(profileOf(s), world, 5);
    expect(second.storyletId).toBe("office_cashbox");
    const secondDone = route(second, ["Взять деньги и дело", "Войти через парадную", "Молча пойти к лестнице", "Долли", "Уйти до рассвета (залог)", "Заложить эту ночь"]);
    expect(q(secondDone, "met.office_cashbox")).toBe(1);
    const third = newNight(profileOf(secondDone), world, 6);
    expect(third.storyletId).not.toBe("office_cashbox");
  });
});

/** From a landing's doors to another landing by the stairs (Eddie is let go on the way).
 *  `floor` is 0 until the first door of the night sets it, so the lobby landing counts as 1. */
function climb(s: GameState, to: number): GameState {
  let cur = s;
  while (Math.max(1, q(cur, "floor")) !== to) {
    const f = Math.max(1, q(cur, "floor"));
    cur = route(cur, ["Лестница", f < to ? UP[f + 1]! : DOWN[f - 1]!]);
  }
  return cur;
}
/** A returning player Dolly trusts enough for the freight lift. */
const TRUSTED: Profile = { v: 1, profile: { nights: 2, dolly_trust: 3, met: 1 } as Record<string, number> };
const LIFT = ["Взять деньги и дело", "Войти через парадную", "Сесть и выпить чаю", "Попросить грузовой лифт"];
const evidenceIds = (s: GameState) => evidenceView(s, world).items.map((i) => `${i.id}${i.tonight ? "*" : ""}`);

describe("belvedere: floors 5–8 and the folder", () => {
  test("clock: 22:00 at the start, 23:30 at turn 3, past midnight at turn 4", () => {
    const s = newNight(emptyProfile(), world, 1);
    expect(clockTime(s, world)).toBe("22:00");
    expect(clockTime({ ...s, run: { turn: 3 } }, world)).toBe("23:30");
    expect(clockTime({ ...s, run: { turn: 4 } }, world)).toBe("00:00");
    expect(clockTime({ ...s, run: { turn: 16 } }, world)).toBe("06:00");
  });

  test("1 + 7: the ring from the box on the first night lands in the folder, remembered next night without 'tonight'", () => {
    const s = play(emptyProfile(), 2024, PLAN_RING);
    expect(q(s, "returned.ring")).toBe(1);
    expect(q(s, "found.ring")).toBe(1);
    expect(evidenceIds(s)).toEqual(["ring*"]);
    const n = newNight(profileOf(s), world, 7);
    expect(evidenceIds(n)).toEqual(["ring"]);
    expect(evidenceView(n, world).locked).toBe(world.evidence.items.length - 1);
    const card = evidenceView(n, world).items.find((i) => i.id === "ring")!;
    expect(card.image).toBe("ev_ring");
    expect(card.title).toBe("Обручальное кольцо");
  });

  test("2: Ruby by the stairs after 01:00, cigarette and record together: lantern returns; before 01:00 her door is locked", () => {
    const first = play(emptyProfile(), 2024, PLAN_RING);
    let s = play(profileOf(first), 11, PLAN_QUICK_EXIT.slice(0, 3)); // wary Dolly, silently to the stairs
    s = climb(s, 7);
    expect(q(s, "turn")).toBeGreaterThanOrEqual(6);
    expect(currentScene(s, world).choices.find((c) => c.text === "Квартира певицы")?.available).toBe(true);
    s = route(s, ["Квартира певицы", "Войти", "Угостить сигаретой", "Попросить поставить пластинку", "Взять пластинку"]);
    expect(q(s, "has.ruby_record")).toBe(1);
    expect(q(s, "debt.ruby")).toBe(2);
    expect(q(s, "met.ruby")).toBe(1);
    s = route(s, ["Уйти"]);
    s = walkUntilDawn(s);
    expect(currentScene(s, world).storylet.id).toBe("pledge_dawn");
    expect(pledgeOptions(s, world).filter((m) => m.canReturn).map((m) => m.id).sort()).toEqual(["lantern", "voice"]);
    s = pledge(s, world, "lantern");
    expect(q(s, "returned.lantern")).toBe(1);
    expect(q(s, "mem.true.lantern")).toBe(1);
    expect(evidenceIds(s)).toContain("ruby_record*");

    // the freight lift reaches the 7th at turn 2: the singer is not home yet
    const early = route(newNight(TRUSTED, world, 3), [...LIFT, "На седьмой"]);
    expect(q(early, "turn")).toBe(2);
    const door = currentScene(early, world).choices.find((c) => c.text === "Квартира певицы")!;
    expect(door.available).toBe(false);
  });

  test("3: the doctor before midnight by the freight lift; the file for a favour; after midnight the treatment room is empty", () => {
    let s = route(newNight(TRUSTED, world, 5), [...LIFT, "На восьмой"]);
    expect(q(s, "turn")).toBe(2);
    expect(currentScene(s, world).storylet.id).toBe("floor_08_doors");
    s = route(s, ["Приёмная доктора", "Сесть на кушетку", "Спросить, за что он не может спать", "Попросить карточку Вивиан Хейл"]);
    expect(q(s, "has.medical_file")).toBe(1);
    expect(q(s, "met.auerbach")).toBe(1);
    s = route(s, ["Уйти", "Процедурная"]);
    expect(q(s, "turn")).toBeGreaterThanOrEqual(4);
    expect(currentScene(s, world).storylet.id).toBe("procedure_room");
    s = route(s, ["Уйти"]);
    s = climb(s, 1);
    s = route(s, ["Долли", "Уйти до рассвета (залог)"]);
    expect(pledgeOptions(s, world).find((m) => m.id === "hospital")?.canReturn).toBe(true);
    s = pledge(s, world, "hospital");
    expect(q(s, "returned.hospital")).toBe(1);
    expect(evidenceIds(s)).toContain("medical_file*");

    // before midnight the doctor is still in the treatment room
    const early = route(newNight(TRUSTED, world, 5), [...LIFT, "На восьмой", "Процедурная"]);
    expect(q(early, "turn")).toBe(3);
    expect(currentScene(early, world).storylet.id).toBe("procedure_doctor");
    // too late on foot: seven flights from the lobby pass midnight, and the doctor's door is locked
    let late = route(newNight(TRUSTED, world, 5), [...LIFT.slice(0, 3), "К лестнице"]);
    late = climb(late, 8);
    expect(q(late, "turn")).toBeGreaterThanOrEqual(4);
    expect(currentScene(late, world).choices.find((c) => c.text === "Приёмная доктора")?.available).toBe(false);
  });

  test("4: the fight with Tony throws Nick onto the fire escape, which stays open on the 6th from then on", () => {
    let s = route(newNight(TRUSTED, world, 8), [...LIFT, "На шестой", "Спортзал", "Остаться стоять"]);
    expect(currentScene(s, world).storylet.id).toBe("tony_gym");
    const before = q(s, "turn");
    s = route(s, ["Выйти на ринг"]);
    expect(currentScene(s, world).storylet.id).toBe("fire_escape_climb");
    expect(q(s, "paths.fire_escape")).toBe(1);
    expect(q(s, "turn")).toBe(before + 2);
    s = route(s, ["Наверх, к окну восьмого"]);
    expect(currentScene(s, world).storylet.id).toBe("floor_08_doors");
    s = climb(s, 6);
    expect(currentScene(s, world).choices.find((c) => c.text === "Окно на пожарную лестницу")?.available).toBe(true);
    s = route(s, ["Окно на пожарную лестницу"]);
    expect(currentScene(s, world).storylet.id).toBe("fire_escape_climb");
    s = walkUntilDawn(route(s, ["Назад, в окно шестого"]));
    s = pick(s, "Заложить эту ночь");
    expect(notebookView(s, world)!.pages.map((p) => p.id)).toContain("fire_escape");
    // next night the window is open from the start
    const n = route(newNight(profileOf(s), world, 9), [...LIFT, "На шестой"]);
    expect(currentScene(n, world).choices.find((c) => c.text === "Окно на пожарную лестницу")?.available).toBe(true);
  });

  test("5: suspicion 7 on the stairs: Gorman takes Nick by the collar, letting him leads to pledge_caught", () => {
    const profile: Profile = { v: 1, profile: { nights: 1 } };
    let s = play(profile, 13, PLAN_QUICK_EXIT.slice(0, 3)); // silent: suspicion 1
    s = climb(s, 2);
    s = route(s, ["Прачечная", "Сделать вид, что не заметил", "Снять цилиндр с полки", "Уйти"]); // +2
    s = climb(s, 4);
    s = route(s, ["Кабинет аудитора", "Сесть без приглашения", "Надавить и потребовать книгу", "Уйти"]); // +1
    s = route(s, ["Служебная дверь", "Вскрыть замок", "Уйти"]); // +2
    expect(q(s, "suspicion")).toBe(6);
    s = route(s, ["Лестница"]);
    expect(currentScene(s, world).storylet.id).toBe("stairs_gorman");
    s = route(s, ["Сказать, что аудитора нет"]); // +1
    expect(q(s, "suspicion")).toBe(7);
    expect(currentScene(s, world).storylet.id).toBe("stairs_gorman_collar");
    s = route(s, ["Дать себя увести"]);
    expect(q(s, "suspicion")).toBe(10);
    expect(currentScene(s, world).storylet.id).toBe("pledge_caught");
    s = pick(s, "Заложить эту ночь");
    expect(s.phase).toBe("report");
    expect(q(s, "seen.caught")).toBe(1);
  });

  test("6: thirteen rows of windows: Mei's favour opens the darkroom; next night the facade offers a recount", () => {
    let s = route(newNight(TRUSTED, world, 21), [...LIFT, "На пятый", "Студия фотографа", "Посмотреть на снимки", "Помочь развесить снимки", "Уйти"]);
    expect(q(s, "debt.mei")).toBe(1);
    expect(q(s, "met.mei")).toBe(1);
    s = route(s, ["Фотолаборатория"]);
    expect(currentScene(s, world).storylet.id).toBe("darkroom");
    s = route(s, ["Отпечатать «Фасад Белведера»", "Пересчитать ещё раз"]);
    expect(q(s, "has.facade_photo")).toBe(1);
    expect(q(s, "paths.thirteen")).toBe(1);
    expect(evidenceIds(s)).toContain("facade_photo*");
    s = route(s, ["Уйти"]);
    s = climb(s, 1);
    s = route(s, ["Долли", "Уйти до рассвета (залог)"]);
    s = pick(s, "Заложить эту ночь");
    if (s.phase === "outcome") s = continueOutcome(s, world);
    expect(notebookView(s, world)!.pages.map((p) => p.id)).toContain("thirteen");

    const n = route(newNight(profileOf(s), world, 22), ["Взять деньги и дело"]);
    const texts = currentScene(n, world).choices.filter((c) => c.available).map((c) => c.text);
    expect(texts).toContain("Сосчитать окна ещё раз");
    expect(texts).not.toContain("Сосчитать окна, пока стоишь под козырьком");
    // without the darkroom the facade still offers the first count
    const fresh = route(newNight(TRUSTED, world, 22), ["Взять деньги и дело"]);
    expect(currentScene(fresh, world).choices.filter((c) => c.available).map((c) => c.text)).toContain("Сосчитать окна, пока стоишь под козырьком");
  });

  test("the darkroom also opens with Eddie's key, for two favours in the laundry", () => {
    let s = route(newNight(TRUSTED, world, 31), [...LIFT, "На второй", "Прачечная", "Сделать вид, что не заметил", "Спросить, куда он хочет уехать", "Спросить про ключ от фотолаборатории", "Уйти"]);
    expect(q(s, "has.darkroom_key")).toBe(1);
    s = climb(s, 5);
    s = route(s, ["Фотолаборатория"]);
    expect(currentScene(s, world).storylet.id).toBe("darkroom");
  });
});
