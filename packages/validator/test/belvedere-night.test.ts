/** Scenario runs on the real Belvedere content. Golden digests live in test/golden/.
 *  If content changes on purpose: UPDATE_GOLDEN=1 bun test, explain in the commit. */
import { describe, expect, test } from "bun:test";
import { choose, continueOutcome, currentOutcome, currentReport, emptyProfile, newNight, pledge, profileOf, type GameState, type Profile } from "@belvedere/engine";
import { expectGolden } from "../../engine/test/golden-helper";
import { loadWorldDir } from "../src/load";

const DIR = import.meta.dir;
const world = await loadWorldDir(`${DIR}/../../../content/belvedere`);

/** A number chooses, "next" leaves an outcome screen, ["pledge", n] pawns memory pair n. */
type Step = number | "next" | ["pledge", number];

function play(profile: Profile, seed: number, plan: Step[]): GameState {
  let s = newNight(profile, world, seed);
  for (const step of plan) {
    if (step === "next") s = continueOutcome(s, world);
    else if (typeof step === "number") s = choose(s, world, step);
    else s = pledge(s, world, step[1]);
  }
  return s;
}

// office(smoke+outcome, take) -> facade -> lobby(card) -> f1 stairs up -> f2 eddie(ask+outcome) -> stairs up
// -> f3 service(leave) -> pool(tea) -> service(contract) -> stairs -> leave tower -> pawn Eddie's memory
const PLAN_PLEDGE: Step[] = [1, "next", 0, 0, 0, 2, 0, 0, 0, "next", 2, 0, 1, 2, 0, 2, 1, 0, 2, 2, ["pledge", 1]];
// same start, then back to eddie (capsule), climb to floor 4, night ends by turn limit in Sloan's door
const PLAN_LIMIT: Step[] = [1, "next", 0, 0, 0, 2, 0, 0, 0, "next", 2, 0, 1, 2, 0, 2, 1, 0, 2, 1, 0, 0, 2, 0, 2, 0, 0];

describe("belvedere full night", () => {
  test("pawning a memory ends the night, returns the true one, updates profile", async () => {
    const s = play(emptyProfile(), 2024, PLAN_PLEDGE);
    expect(s.phase).toBe("report");
    expect(s.profile["nights"]).toBe(1);
    expect(s.profile["mem.false.eddie"]).toBe(0);
    expect(s.profile["mem.true.eddie"]).toBe(1); // returnWhen: seen.eddie == 1, clues >= 2
    expect(s.profile["mem.false.dolly"]).toBeUndefined(); // still default 1
    expect(s.profile["dolly_trust"]).toBe(1);
    expect(s.profile["visited.floor3.service"]).toBe(2);
    const report = currentReport(s, world);
    expect(report.map((r) => r.slot)).toEqual(world.report.slots.map((s) => s.id));
    expect(report.find((r) => r.slot === "twist")?.fragment.id).toBe("twist_contract");
    expect(report.find((r) => r.slot === "price")?.fragment.id).toBe("price_eddie_true");
    expect(report.find((r) => r.slot === "finding")?.text).toContain("Улик собрано: 3.");
    await expectGolden(DIR, "night-pledge-2024", s);
  });

  test("pledging the night keeps memories and marks the report", () => {
    const plan: Step[] = [...PLAN_PLEDGE.slice(0, -1), 0];
    const s = play(emptyProfile(), 2024, plan);
    expect(s.phase).toBe("report");
    expect(s.run["night_pledged"]).toBe(1);
    expect(s.profile["mem.false.eddie"]).toBeUndefined();
    expect(currentReport(s, world).find((r) => r.slot === "price")?.fragment.id).toBe("price_night");
  });

  test("outcome screens render placeholders from the state after effects", () => {
    const s = play(emptyProfile(), 2024, [1]);
    expect(s.phase).toBe("outcome");
    expect(currentOutcome(s, world).text).toContain("Сигарет осталось 2. Улик — 1.");
  });

  test("turn limit ends the night wherever Nick is", async () => {
    const s = play(emptyProfile(), 2024, PLAN_LIMIT);
    expect(s.phase).toBe("report");
    expect(s.run["turn"]).toBe(16);
    expect(s.location).toBe("floor_04"); // night ends before the goto is applied
    await expectGolden(DIR, "night-limit-2024", s);
  });

  test("second night starts from the saved profile with run reset", () => {
    const first = play(emptyProfile(), 2024, PLAN_PLEDGE);
    const second = newNight(profileOf(first), world, 1);
    expect(second.storyletId).toBe("office_again");
    expect(second.run).toEqual({});
    expect(second.profile["dolly_trust"]).toBe(1);
  });

  test("same seed and plan are reproducible", () => {
    expect(play(emptyProfile(), 2024, PLAN_PLEDGE)).toEqual(play(emptyProfile(), 2024, PLAN_PLEDGE));
  });
});
