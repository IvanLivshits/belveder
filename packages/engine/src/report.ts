import type { World } from "@belvedere/content-schema";
import { evaluateAll, type Bags } from "./conditions";
import { nextInt, type RngState } from "./rng";
import { EngineError } from "./state";

/** For every slot picks the highest-priority eligible fragment; ties via RNG. */
export function buildReport(
  state: Bags,
  world: World,
  rng: RngState,
): [report: Record<string, string>, rng: RngState] {
  const report: Record<string, string> = {};
  let r = rng;
  for (const { id: slot } of world.report.slots) {
    const eligible = world.fragments.filter((f) => f.slot === slot && evaluateAll(state, world, f.when));
    if (eligible.length === 0) throw new EngineError(`no report fragment for slot: ${slot}`);
    const top = Math.max(...eligible.map((f) => f.priority));
    const pool = eligible.filter((f) => f.priority === top);
    let pick = pool[0]!;
    if (pool.length > 1) {
      const [i, next] = nextInt(r, pool.length);
      pick = pool[i]!;
      r = next;
    }
    report[slot] = pick.id;
  }
  return [report, r];
}
