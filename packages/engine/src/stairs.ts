import type { Storylet, World } from "@belvedere/content-schema";
import { evaluateAll } from "./conditions";
import { leadTargets } from "./leads";
import { getQuality } from "./qualities";
import type { GameState } from "./state";

type Bags = Pick<GameState, "run" | "profile">;

export interface StairsFloor {
  floor: number;
  /** The landing the walk ends on. */
  location: string;
  label: string;
  /** Moves the walk takes: ceil(|to − from| / 2), at least 1, plus the `costMods` that hold. */
  cost: number;
  /** The lock's text while the floor is closed; null when it is open. */
  locked: string | null;
  /** An open lead points at a door of this floor. */
  lead: boolean;
}

export interface StairsView {
  /** Value of `stairs.quality`: the floor the player stands on. */
  current: number;
  /** Every other floor of `stairs.floors`, bottom to top. */
  floors: StairsFloor[];
  /** The landing of the current floor (free to return to); null when the current floor has none. */
  back: { floor: number; location: string; label: string } | null;
}

/** The stairs screen: a button per floor with its price, locks and paperclips. Null in a world without stairs. */
export function stairsView(state: Bags, world: World): StairsView | null {
  const st = world.stairs;
  if (!st) return null;
  const current = getQuality(state, world, st.quality);
  const label = (location: string) => world.locations.find((l) => l.id === location)?.label ?? location;
  const targets = leadTargets(state, world);
  const mods = st.costMods.filter((m) => evaluateAll(state, world, m.when)).reduce((n, m) => n + m.add, 0);
  const floors = Object.entries(st.floors)
    .map(([n, location]) => ({ floor: Number(n), location }))
    .sort((a, b) => a.floor - b.floor);
  const here = floors.find((f) => f.floor === current);
  return {
    current,
    floors: floors.filter((f) => f.floor !== current).map((f): StairsFloor => {
      const lock = st.locks.find((l) => l.floor === f.floor && !l.open_any.some((group) => evaluateAll(state, world, group)));
      return {
        ...f,
        label: label(f.location),
        cost: Math.max(1, Math.ceil(Math.abs(f.floor - current) / 2)) + mods,
        locked: lock ? lock.text : null,
        // A floor "has" the doors its landing opens: any choice there that leads to a lead's target.
        lead: world.storylets.some((s) => s.location === f.location && s.choices.some((c) => c.goto !== undefined && targets.has(c.goto))),
      };
    }),
    back: here ? { ...here, label: label(here.location) } : null,
  };
}

/** Does an encounter with `floors: [a, b]` lie on the way? The path is every floor after `from` up to and
 *  including `to`, in either direction; an encounter without `floors` can happen anywhere. */
export function onPath(storylet: Storylet, from: number, to: number): boolean {
  if (!storylet.floors) return true;
  const lo = to > from ? from + 1 : to;
  const hi = to > from ? to : from - 1;
  const [a, b] = storylet.floors;
  return a <= hi && b >= lo;
}
