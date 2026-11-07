import type { World } from "@belvedere/content-schema";
import { getQuality } from "./qualities";
import type { Bags } from "./conditions";

/** "HH:MM" from `rules.clock`: start + quality × step minutes, wrapping past midnight. Null without a clock. */
export function clockTime(state: Bags, world: World): string | null {
  const clock = world.rules.clock;
  if (!clock) return null;
  const [h, m] = clock.start.split(":").map(Number) as [number, number];
  const total = (((h * 60 + m + getQuality(state, world, clock.quality) * clock.step) % 1440) + 1440) % 1440;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
