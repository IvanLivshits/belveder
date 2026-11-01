/** Scenario runs on the real Belvedere content. Golden digests live in test/golden/.
 *  If content changes on purpose: UPDATE_GOLDEN=1 bun test, explain in the commit. */
import { describe, expect, test } from "bun:test";
import { choose, currentReport, emptyProfile, newNight, profileOf, type GameState, type Profile } from "@belvedere/engine";
import { expectGolden } from "../../engine/test/golden-helper";
import { loadWorldDir } from "../src/load";

const DIR = import.meta.dir;
const world = await loadWorldDir(`${DIR}/../../../content/belvedere`);

function play(profile: Profile, seed: number, plan: number[]): GameState {
  let s = newNight(profile, world, seed);
  for (const i of plan) s = choose(s, world, i);
  return s;
}

// office(smoke, take) -> facade -> lobby(card) -> f1 stairs up -> f2 eddie(ask) -> stairs up
// -> f3 service(leave) -> pool(tea) -> service(contract) -> stairs -> leave tower -> pledge true memory
const PLAN_PLEDGE = [1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 1, 2, 0, 2, 1, 0, 2, 2, 1];
// same start, then back to eddie (capsule), climb to floor 4, night ends by turn limit in Sloan's door
const PLAN_LIMIT = [1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 1, 2, 0, 2, 1, 0, 2, 1, 0, 0, 2, 0, 2, 0, 0];

describe("belvedere full night", () => {
  test("exit through the pledge builds a report and updates profile", async () => {
    const s = play(emptyProfile(), 2024, PLAN_PLEDGE);
    expect(s.phase).toBe("report");
    expect(s.profile["nights"]).toBe(1);
    expect(s.profile["memories_true"]).toBe(1);
    expect(s.profile["dolly_trust"]).toBe(1);
    expect(s.profile["visited.floor3.service"]).toBe(2);
    const report = currentReport(s, world);
    expect(report.map((r) => r.slot)).toEqual(world.report.slots);
    expect(report.find((r) => r.slot === "twist")?.fragment.id).toBe("twist_contract");
    await expectGolden(DIR, "night-pledge-2024", s);
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
