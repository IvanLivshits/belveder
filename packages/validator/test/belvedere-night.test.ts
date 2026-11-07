/** Scenario runs on the real Belvedere content. Golden digests live in test/golden/.
 *  If content changes on purpose: UPDATE_GOLDEN=1 bun test, one line per golden in docs/golden-changelog.md. */
import { describe, expect, test } from "bun:test";
import {
  choiceCost, choose, clockTime, continueOutcome, currentNotes, currentReport, currentRumor, currentScene, emptyProfile, endingView, evidenceView, extendFeed, getQuality,
  morningNotes, newCase, newNight, notebookView, openFeed, pledge, pledgeOptions, profileOf, progressNotes, storyView, travel,
  type GameState, type Profile,
} from "@belvedere/engine";
import { expectGolden } from "../../engine/test/golden-helper";
import { loadWorldDir } from "../src/load";

const DIR = import.meta.dir;
const world = await loadWorldDir(`${DIR}/../../../content/belvedere`);

/** A string picks the first available choice with that label, a number walks the stairs to that floor,
 *  ["pledge", id] pawns a memory pair. */
type Step = string | number | ["pledge", string];

function act(s: GameState, step: Step): GameState {
  if (typeof step === "number") return travel(s, world, step);
  if (Array.isArray(step)) return pledge(s, world, step[1]);
  const scene = currentScene(s, world);
  const c = scene.choices.find((c) => c.available && c.text === step);
  if (!c) throw new Error(`no choice "${step}" in ${scene.storylet.id}; have: ${scene.choices.map((c) => `${c.available ? "" : "x"}${c.text}`).join(" | ")}`);
  return choose(s, world, c.index);
}

/** Plays the steps; a reply that waits for «Дальше» (it leads elsewhere or ends the night) is passed on the way. */
function route(start: GameState, steps: Step[]): GameState {
  let s = start;
  for (const step of steps) {
    if (s.phase === "outcome") s = continueOutcome(s, world);
    s = act(s, step);
  }
  return s.phase === "outcome" ? continueOutcome(s, world) : s;
}

const q = (s: GameState, id: string) => getQuality(s, world, id);
const open = (s: GameState) => currentScene(s, world).choices.filter((c) => c.available).map((c) => c.text);
const reportOf = (s: GameState) => Object.fromEntries(currentReport(s, world).map((r) => [r.slot, r.fragment.id]));
const feedTexts = (s: GameState) => openFeed(s, world).entries.map((e) => e.text);

/** The directed routes fix the rumor by hand, the way a tester would wait for the right night;
 *  the draw itself (seed, no repeats) has its own tests below. */
function withRumor(s: GameState, id: string): GameState {
  const run = Object.fromEntries(Object.entries(s.run).filter(([k]) => !k.startsWith("rumor.")));
  return { ...s, run: { ...run, [`rumor.${id}`]: 1 } };
}
const night = (p: Profile, seed: number, rumor?: string) => {
  const s = newNight(p, world, seed);
  return rumor === undefined ? s : withRumor(s, rumor);
};

/** What Nick does when someone stops him on the stairs and the test does not care. */
const PASS_BY: Record<string, string> = {
  stairs_eddie: "Отпустить", stairs_pool_pie: "Меня ждут внизу", stairs_chalk: "Пойти дальше",
  stairs_gorman: "Почему вы его ищете?", stairs_gorman_rumor: "Почему вы его ищете?",
};
/** From a landing to the landing of another floor; an encounter on the way is passed by. */
function walk(s: GameState, to: number): GameState {
  const cur = route(s, ["Лестница", to]);
  if (cur.location !== "stairs_event") return cur;
  const pass = PASS_BY[cur.storyletId];
  if (pass === undefined) throw new Error(`unexpected encounter ${cur.storyletId}`);
  return route(cur, [pass]);
}
/** Walks two floors up and down until the turn limit; the lobby hub leads back to the landing. */
function walkUntilDawn(start: GameState): GameState {
  let s = start;
  let guard = 0;
  while (q(s, "turn") < 16 && guard++ < 80) {
    const scene = currentScene(s, world);
    if (s.location === "stairs_event") s = route(s, [PASS_BY[s.storyletId]!]);
    else if (scene.stairs) s = route(s, [scene.stairs.current <= 2 ? scene.stairs.current + 2 : scene.stairs.current - 2]);
    else s = route(s, [open(s).includes("На площадку") ? "На площадку" : "Лестница"]);
  }
  return s;
}
/** From a landing down to Dolly's pledge screen. */
const toPledge = (s: GameState) => route(q(s, "floor") === 1 ? s : walk(s, 1), ["Долли", "Уйти до рассвета (залог)"]);

const TO_LOBBY = ["Открыть", "Взять деньги и дело", "Войти", "Кивнуть"];
/** First night to the fourth floor: Dolly's cigarette, the stairs (Mrs. Pool calls from the third), the auditor's chair. */
const TO_SLOAN: Step[] = [...TO_LOBBY, "Угостить сигаретой", "На площадку", "Лестница", 4, "Меня ждут внизу", "Кабинет аудитора", "Сесть без приглашения"];

// Night 0 from the task: Dolly's cigarette and the invitation, the tag to Eddie and his Denver, Mrs. Pool refused
// on the stairs, room 3-В, the ring, down to Dolly, the marines memory pawned.
const PLAN_RING: Step[] = [
  ...TO_LOBBY, "Угостить сигаретой", "Что значит «12 — выкупить»?", "На площадку",
  "Лестница", 2, "Прачечная", "Сделать вид, что не заметил", "Показать бирку", "Куда хочешь уехать?", "Уйти",
  "Лестница", 3, "Меня ждут внизу", "Комната 3-В", "Перебрать коробку", "Уйти",
  "Лестница", 1, "Долли", "Уйти до рассвета (залог)",
  ["pledge", "ring"],
];
const ringNight = () => route(newNight(emptyProfile(), world, 2024), PLAN_RING);

// The tutorial route: every first-night question on the way to the ring.
const PLAN_FIRST_NIGHT: Step[] = [
  "Открыть", "Что это за дом?", "Вы бывали там сами?", "Взять деньги и дело",
  "Поднять газету", "Войти",
  "Давно вы здесь?", "Что значит «12 — выкупить»?", "На площадку",
  "Лестница", 2, "Прачечная", "Сделать вид, что не заметил", "Показать бирку", "Уйти",
  "Лестница", 3, "Меня ждут внизу", "Комната 3-В", "Перебрать коробку", "Уйти",
  "Лестница", 1, "Долли", "Уйти до рассвета (залог)",
];

/** Any later night while Dolly is still wary: office -> facade -> past Dolly to the landing -> back -> pledge. */
const QUICK_IN: Step[] = ["Взять деньги и дело", "Войти", "Молча пойти к лестнице"];
const QUICK_EXIT: Step[] = [...QUICK_IN, "Долли", "Уйти до рассвета (залог)"];

/** A returning player Dolly trusts enough for the freight lift. */
const TRUSTED: Profile = { v: 1, profile: { nights: 2, dolly_trust: 3 } };
const LIFT: Step[] = ["Взять деньги и дело", "Войти", "Сесть и выпить чаю", "Попросить грузовой лифт"];
/** A quiet night for the routes above the fourth floor: Eddie stays in the laundry, nobody calls from the stairs. */
const quiet = (p: Profile, seed: number) => night(p, seed, "eddie_blue");
const evidenceIds = (s: GameState) => evidenceView(s, world).items.map((i) => `${i.id}${i.tonight ? "*" : ""}`);
const HALE_THINGS = ["laundry_tag*", "matchbook*", "note_12*"];

describe("belvedere: first night", () => {
  test("the game opens on office_morning; Hale's things are in the folder, the rumor is the pie, the notebook has five pages", () => {
    const s = newNight(emptyProfile(), world, 1);
    expect(s.storyletId).toBe("office_morning");
    expect(open(s)).toEqual(["Открыть"]);
    expect(currentScene(s, world).choices[0]!.mode).toBe("do");
    expect(feedTexts(s).length).toBe(4);
    expect(openFeed(s, world).entries[1]).toMatchObject({ who: "gut", label: "ЧУТЬЁ", style: "inner" });
    expect(currentRumor(s, world)?.id).toBe("pool_pie");
    expect(evidenceIds(s)).toEqual(HALE_THINGS);
    const nb = notebookView(s, world)!;
    expect(nb.pages.map((p) => p.id)).toEqual(["case", "belvedere", "night", "cigarettes", "clues"]);
    expect(nb.leads.total).toBe(0);
    expect(nb.vouchers).toBeNull();
    expect(nb.life.footer).toBeNull();
    expect(nb.life.lines.length).toBe(8);
    const after = act(s, "Открыть");
    expect(after.storyletId).toBe("office_first_night");
    expect(q(after, "turn")).toBe(0);
  });

  test("Vivian's things become four leads; three of them put a paperclip on a floor of the stairs", () => {
    let s = route(newNight(emptyProfile(), world, 1), ["Открыть", "Взять деньги и дело"]);
    expect(notebookView(s, world)!.leads.open.map((l) => l.id)).toEqual(["laundry_tag", "matchbook", "note_12", "smoke"]);
    s = route(s, ["Войти", "Кивнуть"]);
    // Dolly speaks tonight's rumor in her own voice
    expect(openFeed(s, world).entries[1]).toMatchObject({ who: "dolly", label: "ДОЛЛИ", text: "Миссис Пул с третьего опять печёт пирог. Весь дом пахнет корицей." });
    s = route(s, ["Что значит «12 — выкупить»?"]);
    expect(q(s, "knows.invitation")).toBe(1);
    const nb = notebookView(s, world)!;
    expect(nb.leads.closed.map((l) => [l.id, l.answer])).toEqual([["note_12", "На двенадцатом Владелец. Наверх пускают, когда поручатся трое."]]);
    expect(nb.leads.open.map((l) => l.id)).toEqual(["laundry_tag", "matchbook", "smoke", "vouchers"]);
    expect(nb.vouchers).toEqual({ title: "Кто за меня поручился", lines: ["—", "—", "—"], footer: "Когда строк станет три — к мисс Шоу на одиннадцатый." });
    s = route(s, ["На площадку", "Лестница"]);
    expect(currentScene(s, world).stairs!.floors.filter((f) => f.lead).map((f) => f.floor)).toEqual([2, 4]); // the tag and the matchbook
    s = route(s, [2]);
    expect(currentScene(s, world).doors.map((d) => [d.text, d.lead])).toEqual([["Прачечная", true], ["Бельё", false], ["Лестница", false]]);
  });

  test("night 0 of the task: the tag, Denver, room 3-В, the ring; turn 10, three leads of seven closed", async () => {
    const s = ringNight();
    expect(s.phase).toBe("report");
    expect(q(s, "turn")).toBe(10);
    expect(q(s, "knows.denver")).toBe(1);
    expect(q(s, "mem.false.marines")).toBe(0);
    expect(q(s, "mem.true.ring")).toBe(1);
    expect(q(s, "memories_returned")).toBe(1);
    expect(q(s, "pledged.ring")).toBe(1);
    expect(q(s, "returned.ring")).toBe(1);
    expect(q(s, "nights")).toBe(1);
    expect(reportOf(s)).toEqual({ client: "client_first", entry: "entry_cig", witnesses: "witnesses_eddie_room", finding: "finding_ring", twist: "twist_ring_returned", price: "price_marines" });
    expect(progressNotes(s, world)).toEqual(["Зацепок закрыто: 3 из 7.", "Поручились: 0 из 3."]);
    expect(notebookView(s, world)!.leads.closed.map((l) => l.id)).toEqual(["laundry_tag", "note_12", "room"]);
    expect(notebookView(s, world)!.leads.open.map((l) => l.id)).toEqual(["matchbook", "smoke", "denver", "vouchers"]);
    expect(s.history.nights[0]!.rumor).toBe("pool_pie");
    expect(evidenceIds(s)).toEqual([...HALE_THINGS, "ring*"]);
    await expectGolden(DIR, "night-ring-2024", s);
  });

  test("tutorial route: Dolly's first pledge screen, only the ring can return, notes on the report", async () => {
    let s = route(newNight(emptyProfile(), world, 5), PLAN_FIRST_NIGHT);
    expect(s.storyletId).toBe("pledge_first_night");
    expect(pledgeOptions(s, world).filter((o) => o.canReturn).map((o) => o.id)).toEqual(["ring"]);
    expect(currentScene(s, world).memories.find((m) => m.id === "ring")?.canReturn).toBe(true);
    s = pledge(s, world, "ring");
    expect(s.phase).toBe("report");
    expect(q(s, "memories_returned")).toBe(1);
    expect(reportOf(s)["entry"]).toBe("entry_hint"); // the invitation, not a cigarette
    expect(currentNotes(s, world)).toEqual(["Это отчёт Ника за ночь. Из таких страниц сложится дело Хейла, и у каждого игрока оно своё."]);
    await expectGolden(DIR, "night-first-5", s);

    // Second night: the tutorial cards are gone, the notebook shows the returned ring and the new pages.
    let n = quiet(profileOf(s), 8);
    expect(n.storyletId).toBe("office_ring");
    n = act(n, "Взять деньги и дело");
    expect(n.storyletId).toBe("facade_night");
    n = act(n, "Войти");
    expect(n.storyletId).toBe("lobby_wary");
    const nb = notebookView(n, world)!;
    expect(nb.life.lines.find((l) => l.pair === "ring")).toEqual({ pair: "ring", status: "real", text: "~~Морская пехота, Тихий океан~~ → Кольцо: свадьба на Канал-стрит" });
    expect(nb.life.lines.filter((l) => l.status === "fake").length).toBe(7);
    for (const id of ["new_tenants", "dolly", "eddie", "report", "rumors"]) expect(nb.pages.map((p) => p.id)).toContain(id);
    expect(nb.pages.map((p) => p.id)).not.toContain("pool"); // she called from the stairs, they have not met
    expect(nb.life.footer).toBe("Почерк в некоторых строках не мой. То есть мой, но другой."); // after the first return
    expect(currentNotes(n, world)).toEqual([]);
  });

  test("dawn on the first night shows pledge_first_dawn, which explains the pledge", () => {
    const s = walkUntilDawn(route(newNight(emptyProfile(), world, 11), [...TO_LOBBY, "Сколько дают за имя?", "На площадку", "Лестница"]));
    expect(q(s, "turn")).toBe(16);
    expect(s.location).toBe("pledge");
    expect(s.storyletId).toBe("pledge_first_dawn");
    expect(currentScene(s, world).memories.length).toBe(8);
  });

  test("first night without a find: Dolly advises pledging the night", () => {
    const s = route(newNight(emptyProfile(), world, 3), [...TO_LOBBY, "Сколько дают за имя?", "Уйти до рассвета (залог)"]);
    expect(s.storyletId).toBe("pledge_first_empty");
    expect(pledgeOptions(s, world).some((o) => o.canReturn)).toBe(false);
    expect(feedTexts(s).at(-1)).toBe("В блокноте три зацепки. Ни одна не закрыта.");
  });

  test("pledging the night keeps memories and marks the report", () => {
    const s = route(newNight(emptyProfile(), world, 2024), [...PLAN_RING.slice(0, -1), "Заложить эту ночь"]);
    expect(s.phase).toBe("report");
    expect(q(s, "night_pledged")).toBe(1);
    expect(q(s, "mem.false.marines")).toBe(1);
    expect(q(s, "memories_returned")).toBe(0);
    expect(reportOf(s)["price"]).toBe("price_night");
  });

  test("morning notes: exactly one line for a pledged night, a hole and a return", () => {
    const empty = route(newNight(emptyProfile(), world, 3), [...TO_LOBBY, "Сколько дают за имя?", "Уйти до рассвета (залог)"]);
    expect(morningNotes(route(empty, ["Заложить эту ночь"]), world)).toEqual(["Вчерашней ночи нет. Список тот же. Почему-то от этого не легче."]);
    expect(morningNotes(pledge(empty, world, "lantern"), world)).toEqual(["Одна строка зачёркнута. На её месте пусто, и пустота ноет, как зуб."]);
    expect(morningNotes(ringNight(), world)).toEqual(["Одна строка переписана. Ты не помнишь, когда успел."]);
  });

  test("choice cost: free 0, a question 1, a long talk 2", () => {
    const s = newNight(emptyProfile(), world, 1);
    const office = currentScene(act(s, "Открыть"), world); // office_first_night: every choice is free
    expect(office.choices.map((c) => choiceCost(s, world, c.choice))).toEqual([0, 0, 0, 0]);
    const all = world.storylets.flatMap((st) => st.choices);
    expect(choiceCost(s, world, all.find((c) => c.do === "Сесть и поесть")!)).toBe(2);
    expect(choiceCost(s, world, all.find((c) => c.say === "Сколько дают за имя?")!)).toBe(1);
  });

  test("same seed and plan are reproducible", () => {
    expect(ringNight()).toEqual(ringNight());
  });
});

describe("belvedere: the feed", () => {
  test("a question at Sloan's desk falls into the feed with his reply; the card is not repeated", () => {
    const s0 = route(newNight(emptyProfile(), world, 3), TO_SLOAN);
    expect(s0.storyletId).toBe("sloan_office");
    const f0 = openFeed(s0, world);
    const s1 = act(s0, "Вы знали Уолтера Хейла?");
    expect(s1.phase).toBe("scene");
    const f1 = extendFeed(f0, s0, s1, world);
    expect(f1.entries.slice(f0.entries.length)).toEqual([
      { kind: "pick", mode: "say", text: "Вы знали Уолтера Хейла?" },
      { kind: "line", who: "sloan", label: "СЛОУН", color: "#8fbf8f", style: "speech", text: "Нет." },
      { kind: "line", who: "gut", label: "ЧУТЬЁ", color: null, style: "inner", text: "Он ответил раньше, чем ты договорил фамилию." },
    ]);
    expect(open(s1)).not.toContain("Вы знали Уолтера Хейла?");
  });

  test("the upper floors speak in lines too: Mei is a speaker, Ruby writes on napkins (style written)", () => {
    let s = route(quiet(TRUSTED, 21), [...LIFT, "На пятый"]);
    expect(s.storyletId).toBe("floor_05_doors");
    expect(openFeed(s, world).entries.map((e) => (e.kind === "line" ? e.style : e.kind))).toEqual(["narrator", "narrator"]);
    s = route(s, ["Студия фотографа"]);
    expect(s.storyletId).toBe("mei_intro");
    const mei = openFeed(s, world).entries.slice(1);
    expect(mei.length).toBe(2);
    expect(mei.every((e) => e.kind === "line" && e.who === "mei" && e.label === "МЭЙ" && e.style === "speech")).toBe(true);
    const f0 = openFeed(s, world);
    const looked = act(s, "Посмотреть на снимки");
    const f1 = extendFeed(f0, s, looked, world);
    expect(f1.entries[f0.entries.length]).toEqual({ kind: "pick", mode: "do", text: "Посмотреть на снимки" });
    // Ruby has no voice: she writes, and her lines are drawn as paper
    let r = route(quiet(TRUSTED, 21), [...LIFT, "На седьмой"]);
    while (q(r, "turn") < 6) r = route(r, ["Гримёрная", "Уйти"]);
    r = route(r, ["Квартира певицы"]);
    expect(r.storyletId).toBe("ruby_intro");
    const ruby = openFeed(r, world).entries.filter((e) => e.kind === "line" && e.who === "ruby");
    expect(ruby.length).toBe(2);
    expect(ruby.every((e) => e.kind === "line" && e.style === "written" && e.label === "РУБИ")).toBe(true);
  });

  test("a rumor line is not drawn on a night without a rumor", () => {
    const s = route(night(profileOf(ringNight()), 7, "lights"), ["Взять деньги и дело", "Войти"]);
    expect(s.storyletId).toBe("lobby_wary");
    expect(feedTexts(s)).toContain("Опять мигает свет. На лестнице темно, ноги переломаешь. Зато никто ничего не видит.");
    const silent: GameState = { ...s, run: Object.fromEntries(Object.entries(s.run).filter(([k]) => !k.startsWith("rumor."))) };
    expect(feedTexts(silent)).toEqual(feedTexts(s).filter((t) => !t.startsWith("Опять мигает свет")));
    expect(feedTexts(silent).length).toBe(2);
  });
});

describe("belvedere: the stairs", () => {
  /** A later night, on the stairs of the first floor at turn 1 (on the pie night Dolly has her own greeting). */
  const onStairs = (rumor = "pool_pie") => route(night(profileOf(ringNight()), 7, rumor), rumor === "pool_pie" ? ["Взять деньги и дело", "Войти", "Кивнуть", "На площадку", "Лестница"] : [...QUICK_IN, "Лестница"]);
  const costs = (s: GameState) => Object.fromEntries(currentScene(s, world).stairs!.floors.map((f) => [f.floor, f.cost]));

  test("from the first floor: the third is one move away, the eighth four, the twelfth is behind the grate", () => {
    const s = onStairs();
    const view = currentScene(s, world).stairs!;
    expect(view.current).toBe(1);
    expect(view.back).toEqual({ floor: 1, location: "floor_01", label: "Площадка 1" });
    expect(costs(s)).toEqual({ 2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 3, 8: 4, 9: 4, 10: 5, 11: 5, 12: 6 });
    expect(view.floors.filter((f) => f.locked !== null).map((f) => [f.floor, f.locked])).toEqual([[12, "Решётка: «Только по приглашению»"]]);
    expect(() => travel(s, world, 12)).toThrow(/floor 12 is locked/);
    // Miss Shaw's pass or Fenn's key opens the grate
    for (const key of ["has.cordelia_pass", "has.clock_key"]) {
      expect(currentScene({ ...s, run: { ...s.run, [key]: 1 } }, world).stairs!.floors.every((f) => f.locked === null)).toBe(true);
    }
    const up = travel(s, world, 8);
    expect(q(up, "turn")).toBe(q(s, "turn") + 4);
    expect(q(up, "floor")).toBe(8);
    expect(q(up, "seen.went_up")).toBe(1);
    // back to the landing is free
    const back = travel(s, world, 1);
    expect(back.location).toBe("floor_01");
    expect(q(back, "turn")).toBe(q(s, "turn"));
  });

  test("on the night the lights flicker every walk is one move longer", () => {
    expect(costs(onStairs("lights"))).toEqual({ 2: 2, 3: 2, 4: 3, 5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 6, 11: 6, 12: 7 });
    expect(feedTexts(onStairs("lights"))).toContain("Лампы мигают. Идёшь на ощупь.");
    expect(feedTexts(onStairs())).toEqual(["Ступени скрипят заранее, будто предупреждают кого-то наверху."]);
  });

  test("Mrs. Pool (floors [3, 3]) calls on the way 1 -> 4 and 4 -> 1, not on 4 -> 5", () => {
    const s = onStairs();
    const called = travel(s, world, 4);
    expect(called.location).toBe("stairs_event");
    expect(called.storyletId).toBe("stairs_pool_pie");
    expect(q(called, "floor")).toBe(4);
    const refused = route(called, ["Меня ждут внизу"]); // free; Nick walks on to the fourth
    expect(refused.storyletId).toBe("floor_04_doors");
    expect(q(refused, "turn")).toBe(q(s, "turn") + 2);
    const fresh = route({ ...refused, run: { ...refused.run, "seen.pool_invited": 0 } }, ["Лестница"]);
    expect(travel(fresh, world, 5).storyletId).not.toBe("stairs_pool_pie");
    expect(travel(fresh, world, 1).storyletId).toBe("stairs_pool_pie");
    // the inner voice recalls Dolly's request only while it can still be kept (turn 5 at most)
    const gut = "Ужин у неё — час, не меньше. А Долли просила зайти.";
    expect(q(called, "turn")).toBe(3);
    expect(feedTexts(called)).toContain(gut);
    const tooLate = travel({ ...s, run: { ...s.run, turn: 4 } }, world, 4); // arrives at turn 6
    expect(tooLate.storyletId).toBe("stairs_pool_pie");
    expect(feedTexts(tooLate)).not.toContain(gut);
    // «Иду» leaves the walk for her table
    const table = route(called, ["Иду"]);
    expect(table.storyletId).toBe("pool_dinner");
    expect(q(table, "floor")).toBe(3);
  });

  test("Eddie runs only above the second floor, after 23:30, and not on the night he is out of sorts", () => {
    const at = (rumor: string, turn: number) => { const s = onStairs(rumor); return { ...s, run: { ...s.run, turn } }; };
    const late = (rumor: string) => at(rumor, 3);
    expect(travel(late("sloan_lamp"), world, 3).storyletId).toBe("floor_03_doors"); // the laundry is on the second
    expect(travel(late("sloan_lamp"), world, 4).storyletId).toBe("stairs_eddie");
    expect(travel(late("eddie_blue"), world, 4).storyletId).toBe("floor_04_doors");
    expect(travel(at("sloan_lamp", 0), world, 4).storyletId).toBe("floor_04_doors"); // 23:00 on arrival: he is not out yet
    // let go, he remembers: the walk goes on to the landing
    const met = travel(late("sloan_lamp"), world, 6);
    expect(feedTexts(met)).toContain("Мистер, мы знакомы? Нет. Показалось. Лицо у вас такое."); // met.eddie from the first night
    const on = route(met, ["Отпустить"]);
    expect(on.storyletId).toBe("floor_06_doors");
    expect(q(on, "debt.eddie")).toBe(1);
  });

  test("v16: Eddie on the stairs once per game; the note is known for good, so the laundry does not ask about it again", () => {
    const first = travel({ ...onStairs("sloan_lamp"), run: { ...onStairs("sloan_lamp").run, turn: 3 } }, world, 4);
    expect(first.storyletId).toBe("stairs_eddie");
    const note = route(first, ["Дать сигарету и спросить, кому записка"]);
    expect(q(note, "knows.owner_note")).toBe(1);
    expect(q(note, "met.eddie_stairs")).toBe(1);
    // the next night: the walk goes on to the landing, and Eddie in the laundry has nothing to add about the note
    const landing = route(night(profileOf(note), 8, "sloan_lamp"), QUICK_IN);
    const next = route(landing, ["Лестница"]);
    expect(travel({ ...next, run: { ...next.run, turn: 3 } }, world, 4).storyletId).toBe("floor_04_doors");
    expect(open(route(walk(landing, 2), ["Прачечная"]))).not.toContain("Угостить сигаретой и спросить, кому записки");
    // the laundry first: on a later night the stairs still stop Nick once, with the note he already knows
    const laundry = route(walk(route(night(profileOf(ringNight()), 8, "sloan_lamp"), QUICK_IN), 2), ["Прачечная", "Угостить сигаретой и спросить, кому записки", "Уйти"]);
    expect(q(laundry, "knows.owner_note")).toBe(1);
    const up = route(night(profileOf(laundry), 9, "sloan_lamp"), [...QUICK_IN, "Лестница"]);
    expect(travel({ ...up, run: { ...up.run, turn: 3 } }, world, 4).storyletId).toBe("stairs_eddie");
  });

  test("v16: Mrs. Pool invites from the stairs only until 03:00 (turn 10)", () => {
    const s = onStairs();
    const at = (turn: number) => travel({ ...s, run: { ...s.run, turn, "seen.eddie": 1 } }, world, 4); // arrives at turn + 2; Eddie is not in the way
    expect(at(8).storyletId).toBe("stairs_pool_pie");
    expect(at(9).storyletId).toBe("floor_04_doors");
  });

  test("the chalk mark on the twelfth is seen once", () => {
    const s = onStairs("eddie_blue");
    const up = travel({ ...s, run: { ...s.run, "has.cordelia_pass": 1 } }, world, 12);
    expect(up.storyletId).toBe("stairs_chalk");
    const landing = route(up, ["Пойти дальше"]);
    expect(landing.storyletId).toBe("floor_12_doors");
    expect(q(landing, "turn")).toBe(q(s, "turn") + 6);
    expect(walk(walk(landing, 11), 12).storyletId).toBe("floor_12_doors");
  });
});

describe("belvedere: the rumor of the night", () => {
  test("night 0 is always the pie; later the rumor follows the seed and never repeats the night before", () => {
    for (let seed = 1; seed <= 12; seed++) expect(currentRumor(newNight(emptyProfile(), world, seed), world)?.id).toBe("pool_pie");
    let profile = profileOf(ringNight());
    const drawn = ["pool_pie"];
    for (let n = 0; n < 30; n++) {
      let s = newNight(profile, world, 300 + n);
      const id = currentRumor(s, world)!.id;
      expect(id).not.toBe(drawn.at(-1)!);
      drawn.push(id);
      // straight to Dolly's envelope, the night itself pawned
      while (s.location !== "lobby") s = route(s, [s.location === "office" ? open(s).at(-1)! : "Войти"]);
      s = route(s, [open(s).at(-1)!]);
      s = route(s.location === "floor_01" ? route(s, ["Долли"]) : s, ["Уйти до рассвета (залог)", "Заложить эту ночь"]);
      expect(s.phase).toBe("report");
      profile = profileOf(s);
      profile.profile["nights_lost"] = 0; // v17: the third night given away would end the game; this test is about the draw
    }
    expect(profile.history!.nights.map((r) => r.rumor)).toEqual(drawn);
    // Nick has met Eddie only: Sloan's lamp and Gorman inside are not talked about yet
    expect(new Set(drawn)).toEqual(new Set(["pool_pie", "eddie_blue", "lights"]));
  });

  test("Sloan's lamp: the archive stands open without a key", () => {
    const s = route(walk(route(night(profileOf(ringNight()), 7, "sloan_lamp"), QUICK_IN), 4), ["Архив"]);
    expect(s.storyletId).toBe("archive_shelves");
    expect(q(s, "suspicion")).toBe(1); // only the silent walk past Dolly
    const locked = route(walk(route(night(profileOf(ringNight()), 7, "eddie_blue"), QUICK_IN), 4), ["Архив"]);
    expect(locked.storyletId).toBe("archive_locked");
  });

  test("flickering lights: the archive lock is picked in the dark without suspicion", () => {
    const s = route(walk(route(night(profileOf(ringNight()), 7, "lights"), QUICK_IN), 4), ["Архив"]);
    expect(open(s)).toEqual(["Вскрыть замок в темноте", "Уйти"]);
    const inside = route(s, ["Вскрыть замок в темноте"]);
    expect(inside.storyletId).toBe("archive_shelves");
    expect(q(inside, "suspicion")).toBe(1);
  });

  test("Gorman inside: he sits on the stairs at once, without waiting for suspicion 4", () => {
    const s = route(night(profileOf(ringNight()), 7, "gorman_inside"), [...QUICK_IN, "Лестница", 2]);
    expect(s.storyletId).toBe("stairs_gorman_rumor");
    expect(open(s)).toEqual(["Угостить сигаретой", "Почему вы его ищете?"]); // «Аудитора нет» needs an auditor Nick has met
    const told = route(s, ["Почему вы его ищете?"]);
    expect(told.storyletId).toBe("floor_02_doors");
    expect(q(told, "knows.shortage")).toBe(1);
    expect(notebookView(told, world)!.leads.open.map((l) => l.id)).toContain("money");
  });

  test("Eddie out of sorts: he talks straight in the laundry and shows the chute without favours", () => {
    let s = route(walk(route(quiet(profileOf(ringNight()), 7), QUICK_IN), 2), ["Прачечная"]);
    expect(s.storyletId).toBe("eddie_laundry");
    expect(feedTexts(s)).toContain("Сегодня не бегаю. Ноги не идут.");
    s = route(s, ["Что случилось?"]);
    expect(q(s, "paths.laundry_chute")).toBe(1);
    s = route(s, ["Уйти"]);
    expect(currentScene(s, world).doors.map((d) => [d.text, d.available])).toEqual([["Прачечная", true], ["Бельё", true], ["Лестница", true]]);
  });
});

describe("belvedere: knowledge", () => {
  test("Sloan is asked about the shortage only once Nick knows of it; the matchbook is one way to learn", () => {
    let s = route(newNight(emptyProfile(), world, 3), TO_SLOAN);
    expect(open(s)).toEqual(["Вы знали Уолтера Хейла?", "Показать коробок с цифрами", "Угостить сигаретой", "Уйти"]); // v18: no promise about the police before Nick knows of the shortage
    s = route(s, ["Показать коробок с цифрами"]);
    expect(q(s, "knows.shortage")).toBe(1);
    expect(q(s, "knows.matchbook")).toBe(1);
    expect(open(s)).toContain("Полиция о вас не узнает");
    expect(open(s)).toContain("Надавить и потребовать книгу");
    expect(open(s)).not.toContain("Куда делись четыре тысячи?"); // needs a favour first
    expect(notebookView(s, world)!.leads.closed.map((l) => l.id)).toContain("matchbook");
    expect(notebookView(s, world)!.leads.open.map((l) => l.id)).toContain("money");
  });

  test("pressure on Sloan, then breaking into the archive: his copy is compared only because he handed it over tonight", () => {
    let s = route(newNight(emptyProfile(), world, 3), [...TO_SLOAN, "Показать коробок с цифрами", "Надавить и потребовать книгу"]);
    expect(q(s, "has.ledger_fake")).toBe(1);
    expect(q(s, "has.ledger_true")).toBe(0);
    s = route(s, ["Уйти", "Архив", "Вскрыть замок"]);
    expect(s.storyletId).toBe("archive_shelves");
    expect(open(s)).toContain("Сравнить с копией Слоуна");
    expect(open(s)).not.toContain("Пошарить за стеллажом");
    s = route(s, ["Сравнить с копией Слоуна"]);
    expect(q(s, "has.ledger_true")).toBe(1);
    expect(q(s, "suspicion")).toBe(3); // 1 for the pressure, 2 for the lock
    // the archive alone, without Sloan's copy: nothing to compare with
    const alone = route(newNight(emptyProfile(), world, 3), [...TO_SLOAN.slice(0, -2), "Архив", "Вскрыть замок"]);
    expect(open(alone)).toEqual(["Взять копию с ближней полки", "Уйти"]);
  });

  test("Sloan tells of the missing money, then hands a fake ledger: the report pits the two Sloans against each other", () => {
    let s = route(newNight(emptyProfile(), world, 3), [...TO_SLOAN, "Показать коробок с цифрами", "Угостить сигаретой", "Куда делись четыре тысячи?", "Надавить и потребовать книгу", "Уйти"]);
    expect(q(s, "seen.sloan_cashbox")).toBe(1);
    expect(q(s, "has.ledger_fake")).toBe(1);
    s = route(toPledge(s), ["Заложить эту ночь"]);
    const report = reportOf(s);
    expect(report["finding"]).toBe("finding_ticket");
    expect(report["twist"]).toBe("twist_fake_vs_ticket");
    expect(Object.values(report)).not.toContain("twist_fake_ledger");
  });

  test("room 3-В is a locked service door until someone tells Nick about it; picking the lock is loud", () => {
    let s = route(newNight(emptyProfile(), world, 3), [...TO_LOBBY, "Угостить сигаретой", "На площадку", "Лестница", 3, "Меня ждут внизу"]);
    expect(currentScene(s, world).doors.map((d) => d.text)).toEqual(["Квартира миссис Пул", "Служебная дверь", "Лестница"]);
    s = route(s, ["Служебная дверь"]);
    expect(s.storyletId).toBe("room_locked");
    s = route(s, ["Вскрыть замок"]);
    expect(s.storyletId).toBe("room_first");
    expect(q(s, "suspicion")).toBe(2);
    // with the knowledge the same door has a name and the key is on the jamb
    const known = route(newNight(emptyProfile(), world, 3), PLAN_RING.slice(0, 17));
    expect(currentScene(known, world).doors.map((d) => d.text)).toEqual(["Квартира миссис Пул", "Комната 3-В", "Лестница"]);
    expect(currentScene(known, world).doors[1]!.lead).toBe(true); // «Что осталось в 3-В?»
  });

  test("at suspicion 5 a tenant door is shown locked and costs nothing", () => {
    let s = route(newNight(emptyProfile(), world, 3), [...TO_LOBBY, "Угостить сигаретой", "На площадку", "Лестница", 2]);
    expect(s.storyletId).toBe("floor_02_doors");
    s = { ...s, run: { ...s.run, suspicion: 5 } };
    const laundry = currentScene(s, world).doors.find((c) => c.text === "Прачечная")!;
    expect(laundry.available).toBe(false);
    expect(() => choose(s, world, laundry.index)).toThrow(/not available/);
    expect(currentScene(s, world).doors.find((c) => c.text === "Лестница")?.available).toBe(true);
  });

  test("a save from before v2 is caught up when the next night starts: Vivian's leads and what the folder proves", () => {
    const old: Profile = { v: 1, profile: { nights: 3, dolly_trust: 2, "found.ring": 1, "found.pawn_ticket": 1, "mem.true.ring": 1, "mem.false.marines": 0, memories_returned: 1 } };
    const s = newNight(old, world, 9);
    for (const id of ["met.vivian", "knows.club", "knows.invitation", "knows.room", "knows.shortage", "knows.matchbook"]) expect(q(s, id)).toBe(1);
    const leads = notebookView(s, world)!.leads;
    expect(leads.closed.map((l) => l.id)).toEqual(["laundry_tag", "matchbook", "note_12", "room"]);
    expect(leads.open.map((l) => l.id)).toEqual(["smoke", "money", "vouchers"]);
    // a save that never found the ring learns nothing about the room; a v2 profile is left alone
    expect(q(newNight({ v: 1, profile: { nights: 1 } }, world, 9), "knows.room")).toBe(0);
    const v2 = profileOf(ringNight());
    expect(newNight(v2, world, 9).profile).toEqual({ ...v2.profile, "found.laundry_tag": 1, "found.matchbook": 1, "found.note_12": 1 });
    // and a new game is not touched at all
    expect(q(newNight(emptyProfile(), world, 9), "met.vivian")).toBe(0);
  });
});

describe("belvedere: saves from before v15, v16 and v17", () => {
  test("the recognition scenes are marked as seen for a profile whose memory had already returned; a fresh profile is stamped first", () => {
    const old: Profile = { v: 1, profile: { nights: 5, "mem.true.name": 1, "mem.true.lantern": 1 } };
    const s = newNight(old, world, 1);
    expect(q(s, "content_version")).toBe(17);
    expect(q(s, "met.pool_walter")).toBe(1);
    expect(q(s, "met.ruby_recognized")).toBe(1);
    expect(q(s, "met.auerbach_shocked")).toBe(0); // the hospital has not returned
    const fresh = newNight(emptyProfile(), world, 1);
    expect(q(fresh, "content_version")).toBe(17);
    expect(q(fresh, "met.pool_walter")).toBe(0);
    // a profile the new content has already seen keeps its scenes when a memory returns later
    const stamped: Profile = { v: 1, profile: { nights: 5, content_version: 15, "mem.true.name": 1 } };
    expect(q(newNight(stamped, world, 1), "met.pool_walter")).toBe(0);
  });

  test("v16: a save that had found the Proprietor's note knows it for good and has met Eddie on the stairs", () => {
    const old: Profile = { v: 1, profile: { nights: 3, content_version: 15, "found.owner_note": 1 } };
    const s = newNight(old, world, 1);
    expect(q(s, "content_version")).toBe(17);
    expect(q(s, "knows.owner_note")).toBe(1);
    expect(q(s, "met.eddie_stairs")).toBe(1);
    const without: Profile = { v: 1, profile: { nights: 3, content_version: 15 } };
    expect(q(newNight(without, world, 1), "met.eddie_stairs")).toBe(0);
    // v17 only stamps: an old save starts counting the nights it gives away from zero
    const v16: Profile = { v: 1, profile: { nights: 9, content_version: 16, dolly_trust: 5 } };
    const n = newNight(v16, world, 1);
    expect(q(n, "content_version")).toBe(17);
    expect(q(n, "nights_lost")).toBe(0);
    expect(q(n, "dolly_trust")).toBe(5);
  });
});

describe("belvedere: Eddie's laundry", () => {
  const LAUNDRY: Step[] = [...TO_LOBBY, "Угостить сигаретой", "На площадку", "Лестница", 2, "Прачечная", "Сделать вид, что не заметил"];

  test("the first visit shows four choices: the tag, a cigarette, Denver and the door; the cylinder only with no cigarettes left", () => {
    const s = route(newNight(emptyProfile(), world, 3), LAUNDRY);
    expect(s.storyletId).toBe("eddie_laundry");
    expect(open(s)).toEqual(["Показать бирку", "Угостить сигаретой и спросить, кому записки", "Куда хочешь уехать?", "Уйти"]);
    const broke: GameState = { ...s, run: { ...s.run, cigarettes: 0 } };
    expect(open(broke)).toEqual(["Показать бирку", "Снять цилиндр с полки", "Куда хочешь уехать?", "Уйти"]);
  });

  test("night 0: Denver is told once and becomes a lead; no advance the same night, no chute on the first night", () => {
    let s = route(newNight(emptyProfile(), world, 3), [...LAUNDRY, "Куда хочешь уехать?"]);
    expect(q(s, "knows.denver")).toBe(1);
    expect(q(s, "debt.eddie")).toBe(2);
    expect(open(s)).toEqual(["Показать бирку", "Угостить сигаретой и спросить, кому записки", "Уйти"]);
    const lead = notebookView(s, world)!.leads.open.find((l) => l.id === "denver")!;
    expect(lead.text).toMatch(/^Эдди хочет в Денвер/);
    s = route(s, ["Уйти"]);
    expect(currentScene(s, world).doors[0]).toMatchObject({ text: "Прачечная", lead: true });
  });

  test("a later night: one favour a night; after the advance neither the key nor the chute", () => {
    const profile: Profile = { ...profileOf(ringNight()), profile: { ...profileOf(ringNight()).profile, "met.mei": 1 } };
    let s = route(walk(route(night(profile, 7, "lights"), QUICK_IN), 2), ["Прачечная"]);
    expect(open(s)).toEqual(["Как выглядел Хейл?", "Угостить сигаретой и спросить, кому записки", "Отдать ему аванс на билет до Денвера", "Уйти"]);
    s = route(s, ["Угостить сигаретой и спросить, кому записки"]);
    expect(open(s)).toContain("Куда ведёт желоб?"); // one favour owed is enough from the second night on
    expect(open(s)).not.toContain("Есть ключ от лаборатории Мэй?"); // that takes two
    const paid = route(s, ["Отдать ему аванс на билет до Денвера"]);
    expect(q(paid, "vouch.eddie")).toBe(1);
    expect(q(paid, "debt.eddie")).toBe(2);
    expect(open(paid)).toEqual(["Как выглядел Хейл?", "Уйти"]);
    expect(notebookView(paid, world)!.leads.closed.map((l) => [l.id, l.answer])).toContainEqual(["denver", "Отдал. Эдди не помнит, что рассказывал мне про Денвер."]);
    // the chute first: then no advance tonight
    const chute = route(s, ["Куда ведёт желоб?"]);
    expect(q(chute, "paths.laundry_chute")).toBe(1);
    expect(open(chute)).toEqual(["Как выглядел Хейл?", "Уйти"]);
  });
});

describe("belvedere: later nights", () => {
  const RING = () => profileOf(ringNight());

  test("office_ring opens the second night only; asking about the chapel keeps the card on screen", () => {
    let n = quiet(RING(), 7);
    expect(n.storyletId).toBe("office_ring");
    expect(n.run).toEqual({ "has.laundry_tag": 1, "has.matchbook": 1, "has.note_12": 1, "rumor.eddie_blue": 1 });
    n = act(n, "Где вы венчались?");
    expect(n.phase).toBe("scene");
    expect(n.storyletId).toBe("office_ring");
    expect(q(n, "met.office_ring")).toBe(0);
    n = route(n, ["Взять деньги и дело"]);
    expect(q(n, "met.office_ring")).toBe(1);
    n = route(n, [...QUICK_EXIT.slice(1)]);
    expect(currentScene(n, world).memories.map((m) => m.id)).not.toContain("ring");
    expect(currentScene(n, world).memories.length).toBe(7);
    n = route(n, ["Заложить эту ночь"]);
    expect(reportOf(n)["client"]).toBe("client_ring");
    const third = quiet(profileOf(n), 8);
    expect(third.storyletId).toBe("office_return");
  });

  test("walking the stairs until turn 16 lands on pledge_dawn", async () => {
    let s = route(newNight(RING(), world, 11), QUICK_IN); // dolly_trust is 1: the wary Dolly lets Nick pass in silence
    s = walkUntilDawn(s);
    expect(q(s, "turn")).toBe(16);
    expect(s.phase).toBe("scene");
    expect(s.location).toBe("pledge");
    expect(s.storyletId).toBe("pledge_dawn");
    expect(currentScene(s, world).memories.length).toBe(7);
    await expectGolden(DIR, "night-dawn-11", s);
  });

  test("Gorman at the car, then suspicion 4 on the stairs: he does not introduce himself twice", () => {
    const toStairs = (car: boolean) => {
      const s = route(night(RING(), 7, "lights"), ["Взять деньги и дело", ...(car ? ["Подойти к машине у фонаря"] : []), "Войти", "Молча пойти к лестнице", "Лестница"]);
      return travel({ ...s, run: { ...s.run, suspicion: 4 } }, world, 2);
    };
    const withCar = toStairs(true);
    expect(withCar.storyletId).toBe("stairs_gorman");
    expect(q(withCar, "met.gorman")).toBe(1);
    expect(feedTexts(withCar)).toContain("Я же сказал, что подожду. Ждать надоело.");
    expect(feedTexts(withCar)).not.toContain("Сержант Горман. А ты Кэллоуэй.");
    expect(feedTexts(toStairs(false))).toContain("Сержант Горман. А ты Кэллоуэй.");
  });

  test("suspicion 7 on the stairs: Gorman takes Nick by the collar, letting him leads to pledge_caught", () => {
    let s = route(quiet({ v: 1, profile: { nights: 1 } }, 13), ["Взять деньги и дело", "Подойти к машине у фонаря", "Войти", "Молча пойти к лестнице"]); // the car and the silence: 2
    s = route(walk(s, 3), ["Служебная дверь", "Вскрыть замок", "Уйти"]); // +2
    expect(q(s, "suspicion")).toBe(4);
    s = route(s, ["Лестница", 4]);
    expect(s.storyletId).toBe("stairs_gorman");
    s = route(s, ["Почему вы его ищете?"]); // Gorman tells of the shortage: now Sloan can be pressed
    s = route(s, ["Кабинет аудитора", "Сесть без приглашения", "Надавить и потребовать книгу", "Уйти"]); // +1, the last door a tenant opens
    s = route(s, ["Архив", "Вскрыть замок", "Уйти"]); // +2
    expect(q(s, "suspicion")).toBe(7);
    s = route(s, ["Лестница", 1]);
    expect(s.storyletId).toBe("stairs_gorman_collar"); // one encounter a walk: the collar waits for the next one
    s = route(s, ["Дать себя увести"]);
    expect(q(s, "suspicion")).toBe(10);
    expect(s.storyletId).toBe("pledge_caught");
    expect(openFeed(s, world).entries[1]).toMatchObject({ who: "tony", label: "ТОНИ" });
    s = act(s, "Заложить эту ночь");
    expect(s.phase).toBe("report");
    expect(q(s, "seen.caught")).toBe(1);
  });

  test("lobby_late greets a veteran once: the second night after it, Dolly is just wary again", () => {
    let s = route(quiet({ v: 1, profile: { nights: 8 } }, 81), ["Взять деньги и дело", "Войти"]);
    expect(s.storyletId).toBe("lobby_late");
    expect(feedTexts(s)[0]).toBe("Ночей за тобой уже 8, а пальто всё то же.");
    s = route(s, ["Кивнуть и пройти"]);
    expect(q(s, "met.dolly_late")).toBe(1);
    const n = route(quiet(profileOf(s), 82), ["Взять деньги и дело", "Войти"]);
    expect(n.storyletId).toBe("lobby_wary");
  });

  test("a save from before the story numbers its next night by the nights counter", () => {
    const s = route(quiet({ v: 1, profile: { nights: 5, dolly_trust: 1 } }, 7), [...QUICK_EXIT, "Заложить эту ночь"]);
    expect(s.history.nights.map((n) => n.night)).toEqual([6]);
  });
});

describe("belvedere: the dilemma of the pie night", () => {
  const pie = () => route(night(profileOf(ringNight()), 21, "pool_pie"), ["Взять деньги и дело", "Войти"]);

  test("Dolly asks Nick to come back before one; kept: her trust and one ride on the lift that does not run", () => {
    let s = pie();
    expect(s.storyletId).toBe("lobby_pie");
    s = route(s, ["Зачем?", "На площадку", "Лестница", 3, "Меня ждут внизу", "Лестница", 1, "Долли"]);
    expect(s.storyletId).toBe("dolly_kept");
    expect(q(s, "turn")).toBeLessThanOrEqual(6);
    const trust = q(s, "dolly_trust");
    s = route(s, ["В другой раз"]);
    expect(q(s, "dolly_trust")).toBe(trust + 1);
    expect(q(s, "has.lift_ride")).toBe(1);
    expect(open(s)).toContain("Попросить грузовой лифт");
    s = route(s, ["Попросить грузовой лифт", "На пятый"]);
    expect(s.storyletId).toBe("floor_05_doors");
    expect(q(s, "has.lift_ride")).toBe(0);
    s = toPledge(s);
    expect(open(route(s, [])).includes("Попросить грузовой лифт")).toBe(false);
    expect(reportOf(route(s, ["Заложить эту ночь"]))["entry"]).toBe("entry_kept");
  });

  test("v18: the word kept but the lift declined: the report says Nick walked", () => {
    let s = route(pie(), ["Зачем?", "На площадку", "Лестница", 3, "Меня ждут внизу", "Лестница", 1, "Долли", "В другой раз"]);
    expect(q(s, "has.lift_ride")).toBe(1);
    s = route(s, ["Уйти до рассвета (залог)", "Заложить эту ночь"]);
    expect(q(s, "seen.lift_used")).toBe(0);
    expect(reportOf(s)["entry"]).toBe("entry_kept_walk");
  });

  test("sat down at Mrs. Pool's table: her voucher and the room, and Dolly waited", () => {
    let s = route(pie(), ["Кивнуть", "На площадку", "Лестница", 3, "Иду"]);
    expect(s.storyletId).toBe("pool_dinner");
    const turn = q(s, "turn");
    s = route(s, ["Сесть за стол и доесть"]);
    expect(q(s, "turn")).toBe(turn + 2); // a long talk
    expect(q(s, "vouch.pool")).toBe(1);
    expect(q(s, "vouches")).toBe(1);
    expect(notebookView(s, world)!.vouchers!.lines).toEqual(["Миссис Пул с третьего", "—", "—"]);
    // she has just told of 3-В and fed him: neither is offered again tonight
    expect(s.storyletId).toBe("pool_table");
    expect(open(s)).toEqual(["Кого вы ждёте?", "Уйти"]);
    // v18: back before one even after dinner is the word kept; "she waited" needs 01:00 (turn 7)
    expect(route(s, ["Уйти", "Лестница", 1, "Долли"]).storyletId).toBe("dolly_kept");
    s = route(s, ["Кого вы ждёте?", "Уйти", "Лестница", 1, "Долли"]);
    expect(q(s, "turn")).toBe(7);
    expect(s.storyletId).toBe("dolly_waited");
    s = route(s, ["Вкусный"]);
    expect(q(s, "has.lift_ride")).toBe(0);
    s = route(s, ["Уйти до рассвета (залог)", "Заложить эту ночь"]);
    expect(reportOf(s)).toMatchObject({ entry: "entry_waited", witnesses: "witnesses_pool_dinner" });
    expect(progressNotes(s, world)).toEqual(["Зацепок закрыто: 3 из 7.", "Поручились: 1 из 3."]);
    // another pie night: the same pie, but she vouches only once
    const again = route(night(profileOf(s), 22, "pool_pie"), ["Взять деньги и дело", "Войти", "Кивнуть", "На площадку", "Лестница", 3, "Иду", "Сесть за стол и доесть"]);
    expect(q(again, "vouches")).toBe(1);
  });
});

describe("belvedere: floors 5–8 and the folder", () => {
  test("clock: 22:00 at the start, 23:30 at turn 3, past midnight at turn 4", () => {
    const s = newNight(emptyProfile(), world, 1);
    expect(clockTime(s, world)).toBe("22:00");
    expect(clockTime({ ...s, run: { turn: 3 } }, world)).toBe("23:30");
    expect(clockTime({ ...s, run: { turn: 4 } }, world)).toBe("00:00");
    expect(clockTime({ ...s, run: { turn: 16 } }, world)).toBe("06:00");
  });

  test("the ring from the box lands in the folder next to Hale's things, remembered next night without 'tonight'", () => {
    const s = ringNight();
    expect(q(s, "found.ring")).toBe(1);
    const n = quiet(profileOf(s), 7);
    expect(evidenceIds(n)).toEqual([...HALE_THINGS, "ring"]); // Vivian brings the three things every night
    expect(evidenceView(n, world).locked).toBe(world.evidence.items.length - 4);
    const card = evidenceView(n, world).items.find((i) => i.id === "ring")!;
    expect(card.image).toBe("ev_ring");
    expect(card.title).toBe("Обручальное кольцо");
    expect(evidenceView(n, world).items[0]).toMatchObject({ id: "laundry_tag", image: undefined, title: "Бирка из прачечной" });
  });

  test("Ruby is home after 01:00: on foot Nick is early now; cigarette and record together bring the lantern back", () => {
    let s = walk(route(quiet(profileOf(ringNight()), 11), QUICK_IN), 7);
    expect(q(s, "turn")).toBe(4); // a move past Dolly, three for the six floors
    expect(currentScene(s, world).doors.find((c) => c.text === "Квартира певицы")?.available).toBe(false);
    while (q(s, "turn") < 6) s = route(s, ["Гримёрная", "Уйти"]);
    s = route(s, ["Квартира певицы", "Войти", "Угостить сигаретой", "Поставите пластинку?", "Взять пластинку"]);
    expect(q(s, "has.ruby_record")).toBe(1);
    expect(q(s, "debt.ruby")).toBe(2);
    expect(q(s, "met.ruby")).toBe(1);
    expect(q(s, "vouch.ruby")).toBe(1); // listening with her is her voucher
    expect(q(s, "vouches")).toBe(1);
    s = toPledge(route(s, ["Уйти"]));
    expect(s.storyletId).toBe("pledge_exit");
    expect(pledgeOptions(s, world).filter((m) => m.canReturn).map((m) => m.id).sort()).toEqual(["lantern", "voice"]);
    s = pledge(s, world, "lantern");
    expect(q(s, "returned.lantern")).toBe(1);
    expect(evidenceIds(s)).toContain("ruby_record*");
  });

  test("the doctor before midnight by the freight lift; the file for a favour; after midnight the treatment room is empty", () => {
    let s = route(quiet(TRUSTED, 5), [...LIFT, "На восьмой"]);
    expect(q(s, "turn")).toBe(2);
    expect(s.storyletId).toBe("floor_08_doors");
    s = route(s, ["Приёмная доктора", "Сесть на кушетку", "Почему вы не спите?", "Покажите карточку Вивиан Хейл"]);
    expect(q(s, "has.medical_file")).toBe(1);
    expect(q(s, "met.auerbach")).toBe(1);
    s = route(s, ["Уйти", "Процедурная"]);
    expect(q(s, "turn")).toBeGreaterThanOrEqual(4);
    expect(s.storyletId).toBe("procedure_room");
    s = toPledge(route(s, ["Уйти"]));
    expect(pledgeOptions(s, world).find((m) => m.id === "hospital")?.canReturn).toBe(true);
    s = pledge(s, world, "hospital");
    expect(q(s, "returned.hospital")).toBe(1);
    expect(evidenceIds(s)).toContain("medical_file*");

    // before midnight the doctor is still in the treatment room
    const early = route(quiet(TRUSTED, 5), [...LIFT, "На восьмой", "Процедурная"]);
    expect(q(early, "turn")).toBe(3);
    expect(early.storyletId).toBe("procedure_doctor");
    // on foot the eighth is four moves away: after the tea Nick is at the door on the stroke of midnight, and it is locked
    const late = walk(route(quiet(TRUSTED, 5), [...LIFT.slice(0, 3), "На площадку"]), 8);
    expect(q(late, "turn")).toBe(5);
    expect(currentScene(late, world).doors.find((c) => c.text === "Приёмная доктора")?.available).toBe(false);
  });

  test("the fight with Tony throws Nick onto the fire escape, which stays open on the 6th from then on", () => {
    let s = route(quiet(TRUSTED, 8), [...LIFT, "На шестой", "Спортзал", "Остаться стоять"]);
    expect(s.storyletId).toBe("tony_gym");
    const before = q(s, "turn");
    s = route(s, ["Выйти на ринг"]);
    expect(s.storyletId).toBe("fire_escape_climb");
    expect(q(s, "paths.fire_escape")).toBe(1);
    expect(q(s, "turn")).toBe(before + 2);
    s = route(s, ["Наверх, к окну восьмого"]);
    expect(s.storyletId).toBe("floor_08_doors");
    s = walk(s, 6);
    expect(currentScene(s, world).doors.find((c) => c.text === "Окно на пожарную лестницу")?.available).toBe(true);
    s = route(s, ["Окно на пожарную лестницу"]);
    expect(s.storyletId).toBe("fire_escape_climb");
    s = route(toPledge(route(s, ["Назад, в окно шестого"])), ["Заложить эту ночь"]);
    expect(notebookView(s, world)!.pages.map((p) => p.id)).toContain("fire_escape");
    // next night the window is open from the start
    const n = route(quiet(profileOf(s), 9), [...LIFT, "На шестой"]);
    expect(currentScene(n, world).doors.find((c) => c.text === "Окно на пожарную лестницу")?.available).toBe(true);
  });

  test("thirteen rows of windows: Mei's favour opens the darkroom; next night the facade offers a recount", () => {
    let s = route(quiet(TRUSTED, 21), [...LIFT, "На пятый", "Студия фотографа", "Посмотреть на снимки", "Помочь развесить снимки", "Уйти"]);
    expect(q(s, "debt.mei")).toBe(1);
    expect(q(s, "met.mei")).toBe(1);
    s = route(s, ["Фотолаборатория"]);
    expect(s.storyletId).toBe("darkroom");
    s = route(s, ["Отпечатать «Фасад Белведера»", "Пересчитать ещё раз"]);
    expect(q(s, "has.facade_photo")).toBe(1);
    expect(q(s, "paths.thirteen")).toBe(1);
    expect(evidenceIds(s)).toContain("facade_photo*");
    s = route(toPledge(route(s, ["Уйти"])), ["Заложить эту ночь"]);
    expect(notebookView(s, world)!.pages.map((p) => p.id)).toContain("thirteen");

    const n = route(quiet(profileOf(s), 22), ["Взять деньги и дело"]);
    expect(open(n)).toContain("Сосчитать окна ещё раз");
    expect(open(n)).not.toContain("Сосчитать окна");
    // without the darkroom the facade still offers the first count
    expect(open(route(quiet(TRUSTED, 22), ["Взять деньги и дело"]))).toContain("Сосчитать окна");
  });

  test("the darkroom also opens with Eddie's key, for two favours in the laundry, once Nick has met Mei", () => {
    const laundry = (p: Profile) => route(night(p, 31, "lights"), [...LIFT, "На второй", "Прачечная", "Сделать вид, что не заметил", "Куда хочешь уехать?"]);
    expect(q(laundry(TRUSTED), "debt.eddie")).toBe(2);
    expect(open(laundry(TRUSTED))).not.toContain("Есть ключ от лаборатории Мэй?"); // whose laboratory?
    let s = route(laundry({ v: 1, profile: { ...TRUSTED.profile, "met.mei": 1 } }), ["Есть ключ от лаборатории Мэй?", "Уйти"]);
    expect(q(s, "has.darkroom_key")).toBe(1);
    s = route(walk(s, 5), ["Фотолаборатория"]);
    expect(s.storyletId).toBe("darkroom");
  });
});

describe("belvedere: Ruby after the lantern", () => {
  /** Burns turns in the dressing room until Ruby is home (turn >= 6), then opens her door. */
  const toRuby = (s: GameState) => {
    let cur = s;
    while (q(cur, "turn") < 6) cur = route(cur, ["Гримёрная", "Уйти"]);
    return route(cur, ["Квартира певицы"]);
  };

  test("once she has written Walter's name, 'как кто' and 'про Хейла' are gone from her hub", () => {
    const profile: Profile = { v: 1, profile: { nights: 3, dolly_trust: 3, content_version: 15, "mem.true.lantern": 1, "mem.false.mcginnis": 0, "met.ruby": 1, "visited.floor7.tenant": 1 } };
    let s = toRuby(route(quiet(profile, 41), [...LIFT, "На седьмой"]));
    expect(s.storyletId).toBe("ruby_recognizes");
    s = route(s, ["Я помню"]);
    expect(q(s, "seen.ruby_recognized")).toBe(1);
    expect(q(s, "met.ruby_recognized")).toBe(1);
    expect(q(s, "debt.ruby")).toBe(1);
    expect(s.storyletId).toBe("ruby_room");
    expect(open(s)).not.toContain("Как кто я пахну?");
    expect(open(s)).not.toContain("Вы знали Хейла?");
    expect(open(s)).toContain("Угостить сигаретой");
    s = route(toPledge(route(s, ["Угостить сигаретой", "Уйти"])), ["Заложить эту ночь"]);
    expect(reportOf(s)["witnesses"]).toBe("witnesses_ruby_walter");
    // once per game: the next night she is just at home
    const again = toRuby(route(quiet(profileOf(s), 43), [...LIFT, "На седьмой"]));
    expect(again.storyletId).toBe("ruby_room");
  });

  test("on the first visit 'как кто' is open and gets its own witness fragment", () => {
    let s = toRuby(route(quiet(TRUSTED, 42), [...LIFT, "На седьмой"]));
    s = route(s, ["Войти", "Как кто я пахну?", "Уйти"]);
    expect(q(s, "seen.ruby_who")).toBe(1);
    s = route(toPledge(s), ["Заложить эту ночь"]);
    expect(reportOf(s)["witnesses"]).toBe("witnesses_ruby_who");
  });
});

/** The campaign of the task, one profile: the ring, the dilemma and the real ledger, two vouchers and the cashbox,
 *  the third voucher and the pass. Then the regression from the profile after the third night: the doctor, Ruby twice,
 *  Mei, the thirteenth floor, and every ending. */
describe("belvedere: the campaign and the five endings", () => {
  /** Office -> facade -> trusting Dolly (tea, and a cigarette while her trust can still grow). */
  const IN = ["Взять деньги и дело", "Войти", "Сесть и выпить чаю"];
  const waitForRuby = (s: GameState) => { let cur = s; while (q(cur, "turn") < 6) cur = route(cur, ["Гримёрная", "Уйти"]); return cur; };

  const night1 = () => ringNight();
  // The pie again: Mrs. Pool refused, back to Dolly by one, her lift to the auditor, the real ledger for silence.
  const night2 = (p: Profile) => {
    let s = route(night(p, 2, "pool_pie"), ["Взять деньги и дело", "Войти", "Кивнуть", "Угостить сигаретой", "На площадку", "Лестница", 3, "Меня ждут внизу", "Лестница", 1, "Долли"]);
    expect(s.storyletId).toBe("dolly_kept");
    expect(q(s, "turn")).toBe(4);
    s = route(s, ["Войти в кабину", "На четвёртый", "Кабинет аудитора", "Сесть без приглашения", "Показать коробок с цифрами", "Угостить сигаретой", "Полиция о вас не узнает"]);
    expect(open(s)).not.toContain("Молчание за настоящую копию"); // v18: the real copy is bought only once Nick has seen the fake one
    s = route(s, ["Надавить и потребовать книгу", "Молчание за настоящую копию", "Уйти"]);
    expect(q(s, "met.sloan_deal")).toBe(1);
    return route(toPledge(s), [["pledge", "ledger"]]);
  };
  // Gorman inside: Nick covers for Sloan, Sloan vouches and tells of the cashbox; Vivian's advance buys Eddie's ticket to Denver.
  const night3 = (p: Profile) => {
    let s = route(night(p, 3, "gorman_inside"), [...IN, "Угостить сигаретой", "На площадку", "Лестница", 4]);
    expect(s.storyletId).toBe("stairs_gorman_rumor");
    s = route(s, ["Аудитора нет", "Кабинет аудитора", "Я прикрыл вас перед Горманом", "Куда делись четыре тысячи?", "Уйти"]);
    s = route(walk(s, 2), ["Прачечная"]);
    expect(open(s)).not.toContain("Куда хочешь уехать?"); // Nick knows; Eddie does not remember telling him
    s = route(s, ["Отдать ему аванс на билет до Денвера", "Уйти"]);
    return route(toPledge(s), [["pledge", "cashbox"]]);
  };
  // The pie a third time: dinner, the third voucher, on foot to Miss Shaw, the pass, the report signed.
  const night4 = (p: Profile) => {
    let s = route(night(p, 4, "pool_pie"), ["Взять деньги и дело", "Войти", "Кивнуть", "На площадку", "Лестница", 3, "Иду", "Сесть за стол и доесть", "Уйти"]);
    expect(q(s, "vouches")).toBe(3);
    s = route(walk(s, 11), ["Приёмная"]); // Eddie on the way up is let go (one turn)
    expect(open(s)).toContain("За меня поручились трое");
    s = route(s, ["За меня поручились трое", "Уйти"]);
    expect(q(s, "has.cordelia_pass")).toBe(1);
    return route(walk(s, 12), ["Ломбард", "Подойти к стойке"]);
  };

  // Regression nights, from the profile after the third: quiet nights, the freight lift.
  const doctor = (p: Profile) => {
    let s = route(quiet(p, 5), [...IN, "Попросить грузовой лифт", "На восьмой"]);
    expect(q(s, "turn")).toBe(2); // v17: no cigarette for Dolly on the way (trust is full since the third night)
    s = route(s, ["Приёмная доктора", "Сесть на кушетку", "Почему вы не спите?", "Промолчать", "Покажите карточку Вивиан Хейл", "Уйти"]);
    expect(q(s, "vouch.auerbach")).toBe(1);
    return route(toPledge(s), [["pledge", "hospital"]]);
  };
  const record = (p: Profile) => {
    let s = waitForRuby(route(quiet(p, 6), [...IN, "Попросить грузовой лифт", "На седьмой"]));
    s = route(s, ["Квартира певицы", "Войти", "Угостить сигаретой", "Поставите пластинку?", "Взять пластинку", "Уйти"]);
    return route(toPledge(s), [["pledge", "lantern"]]);
  };
  const voice = (p: Profile) => {
    let s = waitForRuby(route(quiet(p, 7), [...IN, "Попросить грузовой лифт", "На седьмой"]));
    s = route(s, ["Квартира певицы", "Я помню", "Угостить сигаретой", "Уйти"]);
    return route(toPledge(s), [["pledge", "voice"]]);
  };
  const name = (p: Profile) => {
    const s = route(quiet(p, 8), [...IN, "Попросить грузовой лифт", "На пятый", "Студия фотографа", "Посмотреть на снимки", "Помочь развесить снимки", "Уйти", "Фотолаборатория", "Проявить негатив без подписи", "Уйти"]);
    expect(q(s, "has.signature_photo")).toBe(1);
    return route(toPledge(s), [["pledge", "name"]]);
  };
  // v17, the lore night (N8a): Mei's clipping, the facade print counted twice; the night itself is the first one given away.
  const lore = (p: Profile) => {
    let s = route(inside(quiet(p, 10)), ["Попросить грузовой лифт", "На пятый", "Студия фотографа", "Что это за вырезка?", "Помочь развесить снимки", "Уйти"]);
    s = route(s, ["Фотолаборатория", "Отпечатать «Фасад Белведера»", "Пересчитать ещё раз", "Уйти"]);
    expect(q(s, "knows.fire")).toBe(1);
    expect(q(s, "paths.thirteen")).toBe(1);
    s = closeNight(s);
    expect(q(s, "nights_lost")).toBe(1);
    return s;
  };
  // v17, the book night (N8b): the pass for three vouchers, the first page of the pledge book; Dolly warns before the second night given away.
  const book = (p: Profile) => {
    let s = route(inside(quiet(p, 11)), ["Попросить грузовой лифт", "На одиннадцатый", "Приёмная", "За меня поручились трое", "Уйти"]);
    expect(q(s, "has.cordelia_pass")).toBe(1);
    s = route(walk(s, 12), ["Книга залогов", "Открыть книгу на первой странице", "Уйти"]);
    expect(q(s, "knows.tomorrow")).toBe(1);
    s = route(walk(s, 1), ["Долли", "Уйти до рассвета (залог)"]);
    expect(s.storyletId).toBe("pledge_exit");
    expect(feedTexts(s)).toContain("Одну ночь ты мне уже отдал. Ночь — тоже кусок жизни. Кто отдаёт ночи, тому не к чему возвращаться утром.");
    s = route(s, ["Заложить эту ночь"]);
    expect(q(s, "nights_lost")).toBe(2);
    return s;
  };
  const thirteenth = (p: Profile) => {
    let s = route(inside(quiet(p, 9)), ["Попросить грузовой лифт", "Попросить нажать две кнопки сразу"]);
    expect(s.storyletId).toBe("vault_room");
    s = route(s, ["Найти конверт Вивиан Хейл", "Вернуться к лифту", "Уйти до рассвета (залог)"]);
    return pledge(s, world, "secret");
  };

  /** Profiles after each night, computed once. */
  const P: Profile[] = [];
  const after = (n: number): Profile => {
    const steps = [night1, night2, night3, doctor, record, voice, name, lore, book, thirteenth];
    while (P.length < n) {
      const i = P.length;
      const s = i === 0 ? night1() : steps[i]!(P[i - 1]!);
      expect(s.phase).toBe("report");
      P.push(profileOf(s));
    }
    return P[n - 1]!;
  };
  const returned = (p: Profile) => world.memories.filter((m) => p.profile[m.real] === 1).map((m) => m.id);

  test("night 2: back to Dolly by one, her lift, the real ledger; trust 3", () => {
    const s = night2(after(1));
    expect(q(s, "returned.ledger")).toBe(1);
    expect(q(s, "dolly_trust")).toBe(3);
    expect(reportOf(s)).toMatchObject({ client: "client_ring", entry: "entry_kept", finding: "finding_true_ledger", price: "price_senator_dog" });
    expect(progressNotes(s, world)).toEqual(["Зацепок закрыто: 5 из 8.", "Поручились: 0 из 3."]);
  });

  test("night 3: Sloan and Eddie vouch, the cashbox returns", () => {
    const s = night3(after(2));
    expect(q(s, "returned.cashbox")).toBe(1);
    expect(q(s, "vouches")).toBe(2);
    expect(notebookView(s, world)!.vouchers!.lines).toEqual(["Огден Слоун, аудитор с четвёртого", "Эдди Мэлоун, курьер со второго", "—"]);
    expect(reportOf(s)).toMatchObject({ entry: "entry_tea", twist: "twist_cashbox_returned", price: "price_sheriff" });
    expect(q(s, "has.advance_given")).toBe(1);
    expect(progressNotes(s, world)).toEqual(["Зацепок закрыто: 6 из 8.", "Поручились: 2 из 3."]);
    expect(q(s, "dolly_trust")).toBe(5); // v17: covering for Sloan and Eddie's ticket, not the cigarette (refused for free at 2+)
    expect(q(s, "turn")).toBe(11);
    // the next office card is the hospital bill, once
    expect(newNight(profileOf(s), world, 5).storyletId).toBe("office_cashbox");
  });

  test("night 4, case closed: the third voucher, Miss Shaw's pass, the report signed at turn 14", async () => {
    let s = night4(after(3));
    expect(s.storyletId).toBe("owner_office");
    expect(open(s)).toContain("Подписать: «Уолтер Хейл мёртв»");
    s = route(s, ["Подписать: «Уолтер Хейл мёртв»"]);
    expect(q(s, "turn")).toBe(14); // letting Eddie go on the stairs is free now
    expect(s.phase).toBe("ending");
    expect(s.ending).toBe("case_closed");
    expect(notebookView(s, world)!.vouchers!.lines).toEqual(["Огден Слоун, аудитор с четвёртого", "Эдди Мэлоун, курьер со второго", "Миссис Пул с третьего"]);
    expect(notebookView(s, world)!.leads.closed.map((l) => l.id)).toContain("vouchers");
    // the plain epilogue plus the one for three memories back; the redemption epilogue needs endings.redemption
    expect(endingView(s, world).epilogues.length).toBe(2);
    expect(endingView(s, world).epilogues[1]).toMatch(/Я написал в отчёте «не понял»/);
    const story = storyView(profileOf(s), world, "case_closed");
    expect(story.sections.filter((x) => x.kind === "night").length).toBe(4);
    await expectGolden(DIR, "campaign-case-closed", s);
  });

  test("ten nights return all eight pairs and give two away, Dolly's trust reaches 5, every night is on record", () => {
    const p = after(10);
    expect(returned(p)).toEqual(["ring", "lantern", "ledger", "hospital", "voice", "cashbox", "name", "secret"]);
    expect(p.profile["memories_returned"]).toBe(8);
    expect(p.profile["dolly_trust"]).toBe(5);
    expect(p.profile["nights"]).toBe(10);
    expect(p.profile["nights_lost"]).toBe(2);
    expect(p.history!.pledges).toEqual(["ring", "ledger", "cashbox", "hospital", "lantern", "voice", "name", "secret"]);
    expect(p.history!.nights.map((n) => n.pledged)).toEqual([false, false, false, false, false, false, false, true, true, false]);
    expect(p.history!.nights.map((n) => n.report["price"])).toEqual(["price_marines", "price_senator_dog", "price_sheriff", "price_lorraine", "price_mcginnis", "price_father", "price_license", "price_night", "price_night", "price_scar"]);
    expect(p.history!.nights.map((n) => n.rumor)).toEqual(["pool_pie", "pool_pie", "gorman_inside", ...Array(7).fill("eddie_blue")]);
    expect(p.history!.vouchers).toEqual(["vouch.sloan", "vouch.eddie", "vouch.auerbach", "vouch.ruby"]);
    expect(p.profile["vouches"]).toBe(4);
  });

  test("v18: a ready envelope carries its pair's hint; the father's voice points at Ruby's two napkins", () => {
    let s = waitForRuby(route(quiet(after(5), 57), [...IN, "Попросить грузовой лифт", "На седьмой"]));
    s = toPledge(route(s, ["Квартира певицы", "Я помню", "Угостить сигаретой", "Уйти"]));
    expect(q(s, "debt.ruby")).toBe(2);
    const memories = currentScene(s, world).memories;
    expect(memories.filter((m) => m.canReturn).map((m) => m.id)).toEqual(["voice"]);
    expect(memories.find((m) => m.id === "voice")?.hint).toBe("Руби дважды писала тебе на салфетках. Голос, который ты помнишь с детства, — точно отцовский?");
    expect(world.memories.every((m) => m.hint !== undefined)).toBe(true);
  });

  test("v18: the secret needs Vivian's envelope in hand, not the sight of the thirteenth alone", () => {
    const p: Profile = { v: 1, profile: { nights: 6, dolly_trust: 1, "mem.true.name": 1 } };
    const secret = (run: Record<string, number>) => {
      const start = quiet(p, 77); // the office card of the name, then the wary Dolly
      const s = route(start, [open(start).find((c) => c.endsWith(" дело"))!, ...QUICK_EXIT.slice(1)]);
      return pledgeOptions({ ...s, run: { ...s.run, ...run } }, world).find((m) => m.id === "secret")!;
    };
    expect(secret({ "seen.vault13": 1 }).canReturn).toBe(false);
    expect(secret({ "has.vivian_envelope": 1 }).canReturn).toBe(true);
    expect(after(10).profile["mem.true.secret"]).toBe(1); // the campaign takes the envelope from the vault room
  });

  test("signature: after the thirteenth Vivian waits in the lobby; the truth ends the case, the story holds nine nights", async () => {
    let s = newNight(after(10), world, 10);
    expect(s.storyletId).toBe("office_signature");
    s = route(s, ["Пойти в Белведер"]);
    expect(s.storyletId).toBe("lobby_vivian");
    expect(currentScene(s, world).choices.map((c) => c.choice.ending)).toEqual(["signature_forgive", "signature_truth", "signature_letter"]);
    s = route(s, ["Рассказать ей правду"]);
    expect(s.phase).toBe("ending");
    expect(s.ending).toBe("signature_truth");
    expect(q(s, "endings.signature_truth")).toBe(1);
    const view = endingView(s, world);
    expect(view.title).toBe("Подпись. Правда");
    expect(view.image).toBe("ending_signature");
    expect(view.paragraphs.length).toBe(4);
    expect(view.epilogues.length).toBe(1);
    const story = storyView(profileOf(s), world, "signature_truth");
    expect(story.title).toBe("Дело Хейла");
    expect(story.sections.map((x) => x.kind)).toEqual(["opening", ...Array(9).fill("night"), "pledged_note", "litany", "ending", "epilogues", "closing"]);
    const opening = story.sections[0] as { text: string };
    expect(opening.text).toBe(currentReport(night1(), world).find((r) => r.slot === "client")!.text);
    const litany = story.sections.find((x) => x.kind === "litany") as { text: string };
    expect(litany.text.split(" ").length).toBeGreaterThan(40);
    const nights = story.sections.filter((x) => x.kind === "night") as { night: number; paragraphs: string[] }[];
    expect(nights.map((n) => n.night)).toEqual([1, 2, 3, 4, 5, 6, 7, 10, 11]); // the two nights given away are not in the story
    // prose only: no slot labels; the first night does not repeat the opening, nights with a pawned pair leave the price to the litany
    expect(nights[0]!.paragraphs.length).toBe(4);
    expect(nights[0]!.paragraphs).not.toContain(opening.text);
    expect(nights[1]!.paragraphs.length).toBe(5);
    const price1 = currentReport(night1(), world).find((r) => r.slot === "price")!.text;
    expect(nights[0]!.paragraphs).not.toContain(price1);
    expect(litany.text.startsWith(price1)).toBe(true);
    expect(nights[8]!.paragraphs.length).toBe(6); // the final night pawned nothing
    const labels = world.report.slots.map((sl) => sl.label!);
    for (const n of nights) for (const p of n.paragraphs) expect(labels).not.toContain(p);
    // the report of the final night knows it was the final one
    expect(reportOf(s)).toMatchObject({ twist: "twist_final", price: "price_final" });
    expect(q(s, "ending_night")).toBe(1);
    expect(nights[8]!.paragraphs.at(-1)).toBe(currentReport(s, world).find((r) => r.slot === "price")!.text);
    // a new case keeps only the endings seen: knowledge, vouchers and leads start over
    const fresh = newCase(profileOf(s));
    expect(fresh.profile).toEqual({ "endings.signature_truth": 1 });
    expect(fresh.history).toEqual({ nights: [], pledges: [] });
    const n = newNight(fresh, world, 10);
    expect(n.storyletId).toBe("office_morning");
    expect(currentRumor(n, world)?.id).toBe("pool_pie");
    expect(notebookView(n, world)!.pages.length).toBe(5);
    expect(notebookView(n, world)!.leads.total).toBe(0);
    expect(evidenceIds(n)).toEqual(HALE_THINGS);
    await expectGolden(DIR, "campaign-signature-truth", s);
  });

  test("redemption: with the name back, the real ledger and Sloan's deal; the lift to the 11th, a cigarette for Miss Shaw", () => {
    let s = route(quiet(after(7), 71), ["Поднять трость и взять дело", "Войти", "Сесть и выпить чаю", "Попросить грузовой лифт", "На одиннадцатый"]);
    s = route(s, ["Приёмная"]);
    expect(open(s)).toContain("За меня поручились трое"); // Sloan, Eddie, the doctor and Ruby by now
    s = route(s, ["Чего вы хотите?", "Предложить ей сигарету", "Уйти"]);
    expect(q(s, "has.cordelia_pass")).toBe(1);
    expect(open(route(s, ["Приёмная"]))).not.toContain("За меня поручились трое"); // the pass is already in hand
    s = route(walk(s, 12), ["Ломбард", "Подойти к стойке", "Я выкуплю имя"]);
    expect(s.ending).toBe("redemption");
    expect(q(s, "turn")).toBe(8);
    expect(storyView(profileOf(s), world, "redemption").sections.filter((x) => x.kind === "night").length).toBe(8);
  });

  test("new proprietor: Gorman's car, Fenn's key, the stolen pass, the torn page; the counter at turn 13 with suspicion 6", () => {
    // v18: the car at the lamp is hidden on the night Gorman is inside, so this is Sloan's lamp night; the chair takes 6 (three rude deeds).
    let s = route(night(after(6), 61, "sloan_lamp"), ["Взять деньги и дело", "Подойти к машине у фонаря", "Войти", "Откуда вы знаете, что меня ждут?", "Попросить грузовой лифт", "На десятый"]);
    expect(q(s, "suspicion")).toBe(1);
    s = route(s, ["Мастерская часовщика", "На какую минуту?", "Угостить сигаретой", "Что открывает ключ у вас на шее?", "Уйти"]);
    expect(q(s, "has.clock_key")).toBe(1);
    s = walk(s, 11);
    s = route(s, ["Приёмная", "Взять пропуск, пока она смотрит в окно", "Уйти"]);
    expect(q(s, "has.cordelia_pass")).toBe(1);
    s = walk(s, 12);
    s = route(s, ["Книга залогов"]);
    expect(open(s)).not.toContain("Вырвать страницу с сорок первой строкой"); // v16: first the month itself
    s = route(s, ["Пролистать март"]);
    expect(open(s)).toContain("Вырвать страницу с сорок первой строкой");
    s = route(s, ["Вырвать страницу с сорок первой строкой", "Уйти", "Ломбард", "Подойти к стойке"]);
    expect(q(s, "suspicion")).toBe(6);
    expect(q(s, "turn")).toBe(13); // at the counter; Eddie let go on the way to the 11th costs nothing
    expect(open(s)).toContain("Сесть в его кресло");
    s = route(s, ["Сесть в его кресло"]);
    expect(q(s, "turn")).toBe(14); // the chair itself is a move
    expect(s.ending).toBe("new_proprietor");
  });

  test("v18: on the night Gorman is inside his car is not at the lamp; on another night it is", () => {
    const facade = (rumor: string) => route(night(after(6), 66, rumor), ["Взять деньги и дело"]);
    expect(open(facade("gorman_inside"))).not.toContain("Подойти к машине у фонаря");
    expect(open(facade("sloan_lamp"))).toContain("Подойти к машине у фонаря");
  });

  /** Eddie's chute to the basement, Silas warmed by the furnace; the matches are asked for. */
  const toSilas = (p: Profile) => {
    let s = route(inside(night(p, 62, "sloan_lamp")), ["На площадку"]);
    s = route(walk(s, 2), ["Прачечная", "Угостить сигаретой и спросить, кому записки", "Куда ведёт желоб?", "Уйти", "Бельё", "Прыгнуть"]);
    expect(s.storyletId).toBe("silas_intro");
    return route(s, ["Сесть рядом с огнём", "Кем вы были?", "Прикурить от топки и угостить его", "Дадите спички?"]);
  };

  test("ashes is secret: Silas's matches and Dolly's two buttons need the first line of the book, the match seven memories; the redemption epilogue only once redemption was seen", () => {
    const toMatch = (p: Profile) => {
      let s = toSilas(p);
      expect(q(s, "has.matches")).toBe(1);
      s = route(s, ["Подняться по чёрной лестнице в вестибюль", "Долли", "Попросить грузовой лифт", "Попросить нажать две кнопки сразу"]);
      expect(s.storyletId).toBe("vault_room");
      return route(s, ["Чиркнуть спичкой Сайласа"]);
    };
    const first = toMatch(after(9));
    expect(first.ending).toBe("ashes");
    expect(q(first, "turn")).toBe(11);
    expect(endingView(first, world).epilogues.length).toBe(1);
    // the same campaign in a player who already bought the name back in an earlier case
    const seen: Profile = { ...after(9), profile: { ...after(9).profile, "endings.redemption": 1 } };
    const second = toMatch(seen);
    expect(endingView(second, world).epilogues.length).toBe(2);
    expect(endingView(second, world).epilogues[1]).toMatch(/Вивиан узнала мужа/);
  });

  // v15: the upper floors in lines, with their vouchers, knowledge and lore.
  /** Down to Dolly and the night pledged; a walk that runs into dawn is already on the pledge screen. */
  const closeNight = (s: GameState) => {
    const down = q(s, "floor") === 1 ? s : walk(s, 1);
    return route(down.location === "pledge" ? down : route(down, ["Долли", "Уйти до рассвета (залог)"]), ["Заложить эту ночь"]);
  };
  /** The office card of the night, whichever it is, then the facade and past Dolly (a veteran's greeting, the tea) to her hub. */
  const inside = (s: GameState) => {
    let cur = route(s, [open(s).find((c) => c.endsWith(" дело"))!, "Войти"]);
    for (const step of ["Кивнуть и пройти", "Сесть и выпить чаю"]) if (open(cur).includes(step)) cur = route(cur, [step]);
    return cur;
  };
  test("Mei and Fenn: the clipping, the box of negatives down the dead shaft, the clocks and the number of the night; six vouchers", () => {
    let s = route(night(after(6), 63, "tony_out"), [...IN, "Попросить грузовой лифт", "На пятый", "Студия фотографа", "Посмотреть на снимки"]);
    expect(s.storyletId).toBe("mei_studio");
    expect(open(s)).toContain("Что это за вырезка?"); // from the third night on
    s = route(s, ["Что это за вырезка?"]);
    expect(q(s, "knows.fire")).toBe(1);
    expect(open(s)).not.toContain("Спрятать коробку с негативами"); // first the help
    s = route(s, ["Помочь развесить снимки"]);
    const turn = q(s, "turn");
    const suspicion = q(s, "suspicion");
    s = route(s, ["Спрятать коробку с негативами"]);
    expect(q(s, "turn")).toBe(turn + 2);
    expect(q(s, "suspicion")).toBe(suspicion + 2);
    expect(q(s, "vouch.mei")).toBe(1);
    s = route(walk(route(s, ["Уйти"]), 10), ["Мастерская часовщика", "На какую минуту?"]);
    expect(s.storyletId).toBe("fenn_shop");
    expect(open(s)).not.toContain("Назвать, которая это ночь");
    s = route(s, ["Помочь завести стенные часы", "Назвать, которая это ночь"]);
    expect(q(s, "vouch.fenn")).toBe(1);
    expect(q(s, "vouches")).toBe(6);
    const leads = notebookView(s, world)!.leads;
    expect(leads.closed.find((l) => l.id === "smoke")?.answer).toMatch(/^Здесь был пожар/);
    expect(leads.open.map((l) => l.id)).toContain("tomorrow");
    s = closeNight(route(s, ["Уйти"]));
    expect(notebookView(s, world)!.vouchers!.lines.slice(0, 3)).toEqual(["Огден Слоун, аудитор с четвёртого", "Эдди Мэлоун, курьер со второго", "Доктор Ауэрбах с восьмого"]);
    expect(reportOf(s)["finding"]).toBe("finding_clipping");
    expect(["twist_mei_box", "twist_fenn_count"]).toContain(reportOf(s)["twist"] ?? "");
    P15 = profileOf(s);
  });
  let P15: Profile | undefined;

  test("entry No. 1: three vouchers for Miss Shaw, the first page of the pledge book, the Proprietor on tomorrow; nine leads of nine", () => {
    let s = route(quiet(P15!, 64), [...IN, "Попросить грузовой лифт", "На одиннадцатый", "Приёмная", "За меня поручились трое", "Уйти"]);
    expect(q(s, "has.cordelia_pass")).toBe(1);
    s = route(walk(s, 12), ["Книга залогов"]);
    expect(open(s)).toContain("Открыть книгу на первой странице"); // knows.fire and five memories back
    s = route(s, ["Открыть книгу на первой странице"]);
    expect(q(s, "knows.tomorrow")).toBe(1);
    s = route(s, ["Уйти", "Ломбард", "Подойти к стойке"]);
    expect(open(s)).toContain("Вы заложили завтрашний день");
    s = route(s, ["Вы заложили завтрашний день"]);
    expect(q(s, "seen.owner_tomorrow")).toBe(1);
    s = closeNight(route(s, ["Уйти"]));
    const leads = notebookView(s, world)!.leads;
    expect([leads.done, leads.total]).toEqual([9, 9]);
    expect(reportOf(s)["finding"]).toBe("finding_book_one");
    // the first page is not offered without the clipping or Silas's fire
    const unread = route(quiet({ v: 1, profile: { ...TRUSTED.profile, dolly_trust: 4, memories_returned: 6, vouches: 3 } }, 65), [...IN, "Попросить грузовой лифт", "На одиннадцатый", "Приёмная", "За меня поручились трое", "Уйти"]);
    expect(open(route(walk(unread, 12), ["Книга залогов"]))).not.toContain("Открыть книгу на первой странице");
  });

  // v17: the price of the night, trust for deeds, the secret path to the thirteenth.
  test("v17: Dolly's trust is bought with a cigarette only up to 2; after that she refuses it for free and says why", () => {
    const wary = route(quiet({ v: 1, profile: { nights: 2, dolly_trust: 1 } }, 71), ["Взять деньги и дело", "Войти", "Угостить сигаретой"]);
    expect(q(wary, "dolly_trust")).toBe(2);
    const s = route(quiet(TRUSTED, 71), [...IN]);
    const turn = q(s, "turn");
    const refused = route(s, ["Угостить сигаретой"]);
    expect(q(refused, "dolly_trust")).toBe(3);
    expect(q(refused, "cigarettes")).toBe(q(s, "cigarettes"));
    expect(q(refused, "turn")).toBe(turn);
    expect(q(refused, "seen.dolly_cig")).toBe(1); // her refusal is the reply; once a night
    expect(open(refused)).not.toContain("Угостить сигаретой");
  });

  test("v17: keeping the word to Dolly counts once per game; the second time the ride is there, the trust is not", () => {
    const p = after(2); // met.dolly_kept from the second night
    expect(p.profile["met.dolly_kept"]).toBe(1);
    const s = route(night(p, 72, "pool_pie"), ["Взять деньги и дело", "Войти", "Кивнуть", "На площадку", "Лестница", 3, "Меня ждут внизу", "Лестница", 1, "Долли"]);
    expect(s.storyletId).toBe("dolly_kept_again");
    expect(feedTexts(s)).toContain("Опять пришёл вовремя. Я начинаю к этому привыкать. Это опасно.");
    const trust = q(s, "dolly_trust");
    const again = route(s, ["В другой раз"]);
    expect(q(again, "dolly_trust")).toBe(trust);
    expect(q(again, "has.lift_ride")).toBe(1);
  });

  test("v17: a shameful exit (suspicion 5–9) or Tony's collar costs a point of trust, with an envelope and with the night alike", () => {
    const exit = (suspicion: number) => {
      const s = route(quiet(TRUSTED, 73), IN); // tea with Dolly, then straight back to her envelope
      return route({ ...s, run: { ...s.run, suspicion } }, ["Уйти до рассвета (залог)"]);
    };
    const quietExit = exit(4);
    expect(quietExit.storyletId).toBe("pledge_exit");
    expect(q(route(quietExit, ["Заложить эту ночь"]), "dolly_trust")).toBe(3);
    const shamed = exit(6);
    expect(shamed.storyletId).toBe("pledge_shamed");
    expect(feedTexts(shamed)).toContain("Мне за тебя стыдно, Ник. Это я запомню.");
    const night = route(shamed, ["Заложить эту ночь"]);
    expect(night.phase).toBe("report");
    expect(q(night, "dolly_trust")).toBe(2);
    expect(q(night, "nights_lost")).toBe(1);
    const envelope = pledge(shamed, world, "ring");
    expect(q(envelope, "dolly_trust")).toBe(2);
    expect(q(envelope, "nights_lost")).toBe(0);
    expect(q(envelope, "pledged.ring")).toBe(1);
    const caught = exit(10);
    expect(caught.storyletId).toBe("pledge_caught");
    expect(feedTexts(caught)).toContain("Тебя привели за шиворот, Ник. Это я тоже запомню. Выбирай сам.");
    expect(q(route(caught, ["Заложить эту ночь"]), "dolly_trust")).toBe(2);
  });

  test("v17: the first night given away is not counted; the third makes Nick a tenant (ending tenant)", () => {
    // the first night: no counter yet
    expect(q(route(newNight(emptyProfile(), world, 3), [...PLAN_FIRST_NIGHT, "Заложить эту ночь"]), "nights_lost")).toBe(0);
    const p: Profile = { v: 1, profile: { nights: 4, dolly_trust: 1, nights_lost: 2 } };
    const s = route(quiet(p, 74), QUICK_EXIT);
    expect(s.storyletId).toBe("pledge_exit");
    expect(feedTexts(s)).toContain("Две ночи. Отдашь третью — утром проснёшься в 3-В. Новым жильцом. Я тебя предупредила.");
    expect(open(s)).not.toContain("Заложить эту ночь");
    expect(open(s)).toContain("Заложить третью ночь");
    expect(currentScene(s, world).memories.length).toBe(8); // the envelopes are still the way out
    const end = route(s, ["Заложить третью ночь"]);
    expect(end.phase).toBe("ending");
    expect(end.ending).toBe("tenant");
    expect(q(end, "endings.tenant")).toBe(1);
    const view = endingView(end, world);
    expect(view.title).toBe("Жилец");
    expect(view.image).toBe("room_newtenant");
    expect(view.epilogues.length).toBe(1);
    const closed: Profile = { ...p, profile: { ...p.profile, "endings.case_closed": 1 } };
    expect(endingView(route(quiet(closed, 74), [...QUICK_EXIT, "Заложить третью ночь"]), world).epilogues.length).toBe(2);
    // at dawn and after a shameful night the third night is the same ending
    const dawn = route({ ...route(quiet(p, 75), QUICK_IN), run: { ...route(quiet(p, 75), QUICK_IN).run, turn: 16 } }, ["Долли"]);
    expect(dawn.storyletId).toBe("pledge_dawn");
    expect(open(dawn)).toEqual(["Заложить третью ночь"]);
  });

  test("v17: the thirteenth needs the first line of the book and the counted floors, not trust alone; Silas keeps his matches until then", () => {
    const trusted = (extra: Record<string, number>) => route(quiet({ v: 1, profile: { nights: 6, dolly_trust: 5, memories_returned: 6, ...extra } }, 76), [...IN, "Попросить грузовой лифт"]);
    expect(open(trusted({}))).not.toContain("Попросить нажать две кнопки сразу");
    expect(open(trusted({}))).not.toContain("Спросить про тринадцатый");
    const counted = trusted({ "paths.thirteen": 1 });
    expect(open(counted)).not.toContain("Попросить нажать две кнопки сразу");
    const asked = route(counted, ["Спросить про тринадцатый"]);
    expect(q(asked, "turn")).toBe(q(counted, "turn")); // free
    expect(q(asked, "seen.ask13")).toBe(1); // Dolly's answer is the reply: first read the first line
    expect(open(asked)).not.toContain("Спросить про тринадцатый");
    expect(open(trusted({ "paths.thirteen": 1, "knows.tomorrow": 1 }))).toContain("Попросить нажать две кнопки сразу");
    // Silas, before the book is read: a refusal with its reason, no matches
    const silas = toSilas(after(6));
    expect(q(silas, "has.matches")).toBe(0);
    expect(q(silas, "seen.silas_refused")).toBe(1); // the refusal with its reason is the reply
    expect(open(silas)).not.toContain("Дадите спички?");
  });

  test("v16: after the shock the doctor is not asked whether Vivian Hale was his patient", () => {
    let s = route(quiet(after(4), 52), [...IN, "Попросить грузовой лифт", "На восьмой", "Приёмная доктора"]);
    expect(s.storyletId).toBe("auerbach_shock");
    s = route(s, ["Какую ночь?"]);
    expect(q(s, "met.auerbach_shocked")).toBe(1);
    expect(s.storyletId).toBe("auerbach_office");
    expect(open(s)).not.toContain("У вас лечилась Вивиан Хейл?");
    // before the hospital returned the question is there
    const before = route(quiet(after(3), 52), [...IN, "Попросить грузовой лифт", "На восьмой", "Приёмная доктора", "Сесть на кушетку"]);
    expect(open(before)).toContain("У вас лечилась Вивиан Хейл?");
  });

  test("doctor_late: the doctor receives until two; judging him closes the file", () => {
    let s = route(night(TRUSTED, 51, "doctor_late"), [...LIFT, "На восьмой", "Процедурная", "Уйти", "Процедурная"]);
    expect(q(s, "turn")).toBe(4);
    expect(s.storyletId).toBe("procedure_doctor_late");
    s = route(s, ["Уйти"]);
    expect(currentScene(s, world).doors.find((c) => c.text === "Приёмная доктора")?.available).toBe(true);
    s = route(s, ["Приёмная доктора", "Сесть на кушетку", "Почему вы не спите?"]);
    expect(open(s)).toEqual(expect.arrayContaining(["Промолчать", "Вы продали её, чтобы спать", "Покажите карточку Вивиан Хейл"]));
    s = route(s, ["Вы продали её, чтобы спать"]);
    expect(open(s)).not.toContain("Покажите карточку Вивиан Хейл");
    expect(open(s)).not.toContain("Промолчать");
    expect(q(s, "vouch.auerbach")).toBe(0);
    s = route(toPledge(route(s, ["Уйти"])), ["Заложить эту ночь"]);
    expect(reportOf(s)["witnesses"]).toBe("witnesses_auerbach_judged");
  });

  test("ruby_early: her door opens at midnight; the record for her voucher, the label in the dressing room, then 'who is У.'", () => {
    let s = route(night(TRUSTED, 52, "ruby_early"), [...LIFT, "На седьмой", "Гримёрная", "Уйти", "Гримёрная", "Уйти"]);
    expect(q(s, "turn")).toBe(4);
    expect(currentScene(s, world).doors.find((c) => c.text === "Квартира певицы")?.available).toBe(true);
    s = route(s, ["Квартира певицы", "Войти"]);
    expect(open(s)).not.toContain("Кто такой «У.»?"); // Nick has not read the label yet
    s = route(s, ["Поставите пластинку?"]);
    expect(q(s, "vouch.ruby")).toBe(1);
    s = route(s, ["Уйти", "Гримёрная", "Снять иглу"]);
    expect(q(s, "knows.ruby_u")).toBe(1);
    expect(notebookView(s, world)!.leads.open.map((l) => l.id)).toContain("ruby_u");
    s = route(s, ["Уйти", "Квартира певицы"]);
    expect(open(s)).toContain("Кто такой «У.»?");
    s = route(s, ["Кто такой «У.»?"]);
    expect(q(s, "knows.ruby_coffee")).toBe(1);
    expect(notebookView(s, world)!.leads.closed.map((l) => l.id)).toContain("ruby_u");
    s = route(toPledge(route(s, ["Уйти"])), ["Заложить эту ночь"]);
    expect(reportOf(s)["witnesses"]).toBe("witnesses_ruby_listen");
  });

  test("tony_out: the gym is empty and the window to the fire escape is open, no fight needed", () => {
    let s = route(night(TRUSTED, 53, "tony_out"), [...LIFT, "На шестой", "Спортзал"]);
    expect(s.storyletId).toBe("tony_away");
    s = route(s, ["Вылезти на пожарную лестницу"]);
    expect(s.storyletId).toBe("fire_escape_climb");
    expect(q(s, "paths.fire_escape")).toBe(1);
    s = route(s, ["Наверх, к окну восьмого"]);
    expect(s.storyletId).toBe("floor_08_doors");
  });

  test("guest_upstairs: Miss Shaw is busy, the archive hears the two of them through the wall", () => {
    let s = route(inside(night(after(6), 54, "guest_upstairs")), ["Попросить грузовой лифт", "На одиннадцатый", "Приёмная"]);
    expect(s.storyletId).toBe("cordelia_busy");
    expect(q(s, "has.cordelia_pass")).toBe(0);
    s = route(s, ["Уйти", "Архив посещений"]);
    expect(open(s)).toContain("Прислушаться к голосам за стеной");
    s = route(s, ["Прислушаться к голосам за стеной"]);
    expect(q(s, "seen.archive_overheard")).toBe(1);
    s = route(toPledge(route(s, ["Уйти"])), ["Заложить эту ночь"]);
    expect(reportOf(s)["witnesses"]).toBe("witnesses_overheard");
  });

  test("no repeats: Mrs. Pool calls Nick Walter once per game, and dinner is not offered after it", () => {
    let s = route(inside(quiet(after(7), 82)), ["Попросить грузовой лифт", "На третий", "Квартира миссис Пул"]);
    expect(s.storyletId).toBe("pool_walter");
    s = route(s, ["Вы ошибаетесь"]);
    expect(q(s, "met.pool_walter")).toBe(1);
    expect(s.storyletId).toBe("pool_table");
    s = route(s, ["Уйти", "Квартира миссис Пул"]);
    expect(s.storyletId).toBe("pool_table");
    const next = route(inside(quiet(profileOf(closeNight(route(s, ["Уйти"]))), 83)), ["Попросить грузовой лифт", "На третий", "Квартира миссис Пул"]);
    expect(next.storyletId).toBe("pool_table");
  });
});
