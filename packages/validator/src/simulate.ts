/** Plays N nights with random choices (seeded) and reports coverage and stuck states. */
import type { World } from "@belvedere/content-schema";
import { choose, continueOutcome, currentScene, emptyProfile, newNight, nextInt, pledge, profileOf, seedRng, type GameState, type Profile } from "@belvedere/engine";

export interface SimulationReport {
  nights: number;
  /** Nights ended by pawning a memory. */
  endedByPledge: number;
  /** Nights ended by an endNight choice (with or without an outcome screen). */
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
    nights, endedByPledge: 0, endedByChoice: 0, stuck: [], errors: [], neverShown: [], neverTaken: [],
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
      while (s.phase !== "report" && steps++ < maxSteps) {
        if (s.phase === "outcome") { s = continueOutcome(s, world); if (s.phase === "report") r.endedByChoice++; continue; }
        const scene = currentScene(s, world);
        shown.add(scene.storylet.id);
        const open = scene.choices.filter((c) => c.available);
        const options = open.length + scene.memories.length;
        if (options === 0) { r.stuck.push({ seed, storylet: scene.storylet.id }); break; }
        const [i, next] = nextInt(rng, options);
        rng = next;
        if (i < open.length) {
          const pick = open[i]!;
          taken.add(`${scene.storylet.id}#${pick.index}`);
          s = choose(s, world, pick.index);
          if (s.phase === "report") r.endedByChoice++;
        } else {
          const m = scene.memories[i - open.length]!;
          taken.add(`${scene.storylet.id}#mem:${m.id}`);
          s = pledge(s, world, m.id);
          r.endedByPledge++;
        }
        if (s.phase === "report") {
          const turns = turnQ ? (s.run[turnQ] ?? 0) : steps;
          turnsTotal += turns;
          r.turns.min = Math.min(r.turns.min, turns);
          r.turns.max = Math.max(r.turns.max, turns);
          profile = profileOf(s);
        }
      }
      if ((s as GameState).phase === "scene" && steps >= maxSteps) r.errors.push({ seed, message: `night did not end within ${maxSteps} steps` });
    } catch (e) {
      r.errors.push({ seed, message: (e as Error).message });
    }
  }
  const ended = r.endedByPledge + r.endedByChoice;
  r.turns.avg = ended ? turnsTotal / ended : 0;
  if (!Number.isFinite(r.turns.min)) r.turns.min = 0;
  r.neverShown = world.storylets.map((s) => s.id).filter((id) => !shown.has(id));
  r.neverTaken = world.storylets.flatMap((s) => s.choices.map((_, i) => `${s.id}#${i}`)).filter((k) => !taken.has(k));
  return r;
}

export function formatSimulation(r: SimulationReport): string {
  const lines = [
    `simulated ${r.nights} nights`,
    `  ended by memory pledge: ${r.endedByPledge}, by endNight choice: ${r.endedByChoice}, stuck: ${r.stuck.length}, errors: ${r.errors.length}`,
    `  turns per night: min ${r.turns.min}, avg ${r.turns.avg.toFixed(1)}, max ${r.turns.max}`,
  ];
  if (r.stuck.length) lines.push(`  stuck at: ${[...new Set(r.stuck.map((s) => s.storylet))].join(", ")}`);
  for (const e of r.errors.slice(0, 5)) lines.push(`  error (seed ${e.seed}): ${e.message}`);
  if (r.neverShown.length) lines.push(`  storylets never shown (${r.neverShown.length}): ${r.neverShown.join(", ")}`);
  if (r.neverTaken.length) lines.push(`  choices never taken (${r.neverTaken.length}): ${r.neverTaken.join(", ")}`);
  return lines.join("\n");
}
