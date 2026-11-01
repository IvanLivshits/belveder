/** Plays N nights with random choices (seeded) and reports coverage and stuck states. */
import type { World } from "@belvedere/content-schema";
import { choose, currentScene, emptyProfile, newNight, nextInt, profileOf, seedRng, type Profile } from "@belvedere/engine";

export interface SimulationReport {
  nights: number;
  endedByRule: number;
  endedByChoice: number;
  stuck: { seed: number; storylet: string }[];
  errors: { seed: number; message: string }[];
  neverShown: string[];
  neverTaken: string[];
  turns: { min: number; avg: number; max: number };
}

export interface SimulationOptions {
  nights?: number;
  seed?: number;
  /** Chain nights on one profile for this many nights, then reset. */
  profileChain?: number;
  /** Safety cap on choices per night. */
  maxSteps?: number;
}

export function simulate(world: World, opts: SimulationOptions = {}): SimulationReport {
  const nights = opts.nights ?? 200;
  const chain = opts.profileChain ?? 5;
  const maxSteps = opts.maxSteps ?? 200;
  const turnQ = world.rules.onChoice.length ? world.rules.onChoice[0]!.split(/\s/)[0]! : undefined;

  const shown = new Set<string>();
  const taken = new Set<string>();
  const r: SimulationReport = {
    nights, endedByRule: 0, endedByChoice: 0, stuck: [], errors: [], neverShown: [], neverTaken: [],
    turns: { min: Infinity, avg: 0, max: 0 },
  };
  let rng = seedRng(opts.seed ?? 1);
  let profile: Profile = emptyProfile();
  let turnsTotal = 0;

  for (let n = 0; n < nights; n++) {
    if (n % chain === 0) profile = emptyProfile();
    const seed = (opts.seed ?? 1) * 100000 + n;
    try {
      let s = newNight(profile, world, seed);
      let steps = 0;
      while (s.phase === "scene" && steps++ < maxSteps) {
        const scene = currentScene(s, world);
        shown.add(scene.storylet.id);
        const open = scene.choices.filter((c) => c.available);
        if (open.length === 0) { r.stuck.push({ seed, storylet: scene.storylet.id }); break; }
        const [i, next] = nextInt(rng, open.length);
        rng = next;
        const pick = open[i]!;
        taken.add(`${scene.storylet.id}#${pick.index}`);
        const before = s;
        s = choose(s, world, pick.index);
        if (s.phase === "report") {
          if (pick.choice.endNight) r.endedByChoice++; else r.endedByRule++;
          const turns = turnQ ? (s.run[turnQ] ?? 0) : steps;
          turnsTotal += turns;
          r.turns.min = Math.min(r.turns.min, turns);
          r.turns.max = Math.max(r.turns.max, turns);
          profile = profileOf(s);
          void before;
        }
      }
      if (s.phase === "scene" && steps >= maxSteps) r.errors.push({ seed, message: `night did not end within ${maxSteps} steps` });
    } catch (e) {
      r.errors.push({ seed, message: (e as Error).message });
    }
  }
  const ended = r.endedByRule + r.endedByChoice;
  r.turns.avg = ended ? turnsTotal / ended : 0;
  if (!Number.isFinite(r.turns.min)) r.turns.min = 0;
  r.neverShown = world.storylets.map((s) => s.id).filter((id) => !shown.has(id));
  r.neverTaken = world.storylets.flatMap((s) => s.choices.map((_, i) => `${s.id}#${i}`)).filter((k) => !taken.has(k));
  return r;
}

export function formatSimulation(r: SimulationReport): string {
  const lines = [
    `simulated ${r.nights} nights`,
    `  ended by rule: ${r.endedByRule}, by endNight choice: ${r.endedByChoice}, stuck: ${r.stuck.length}, errors: ${r.errors.length}`,
    `  turns per night: min ${r.turns.min}, avg ${r.turns.avg.toFixed(1)}, max ${r.turns.max}`,
  ];
  if (r.stuck.length) lines.push(`  stuck at: ${[...new Set(r.stuck.map((s) => s.storylet))].join(", ")}`);
  for (const e of r.errors.slice(0, 5)) lines.push(`  error (seed ${e.seed}): ${e.message}`);
  if (r.neverShown.length) lines.push(`  storylets never shown (${r.neverShown.length}): ${r.neverShown.join(", ")}`);
  if (r.neverTaken.length) lines.push(`  choices never taken (${r.neverTaken.length}): ${r.neverTaken.join(", ")}`);
  return lines.join("\n");
}
