import { RESERVED_QUALITIES, type Rumor, type World } from "@belvedere/content-schema";
import { evaluateAll, type Bags } from "./conditions";
import { nightQuality } from "./cost";
import { getQuality, setQuality } from "./qualities";
import { nextInt } from "./rng";
import type { GameState } from "./state";

/** Tonight's rumor: the one whose run flag `rumor.<id>` is set. */
export function currentRumor(state: Bags, world: World): Rumor | undefined {
  return world.rumors.find((r) => getQuality(state, world, RESERVED_QUALITIES.rumorPrefix + r.id) === 1);
}

/** Draws the night's rumor and sets `rumor.<id> = 1`. The very first night (night counter 0) gets
 *  `rules.firstNightRumor`; later ones a seeded pick among rumors whose `when` holds, never last night's. */
export function drawRumor(state: GameState, world: World): GameState {
  if (world.rumors.length === 0) return state;
  const counter = nightQuality(world);
  const firstNight = counter === null ? state.history.nights.length === 0 : getQuality(state, world, counter) === 0;
  let id = firstNight ? world.rules.firstNightRumor : undefined;
  let rng = state.rng;
  if (id === undefined) {
    const last = state.history.nights.at(-1)?.rumor;
    const pool = world.rumors.filter((r) => r.id !== last && evaluateAll(state, world, r.when));
    if (pool.length === 0) return state;
    let i = 0;
    if (pool.length > 1) [i, rng] = nextInt(rng, pool.length);
    id = pool[i]!.id;
  }
  return setQuality({ ...state, rng }, world, RESERVED_QUALITIES.rumorPrefix + id, 1);
}
