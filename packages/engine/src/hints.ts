import type { World } from "@belvedere/content-schema";
import { getQuality } from "./qualities";
import type { Bags } from "./conditions";

/** Ids of qualities whose value differs between two states, sorted. Bags drop defaults,
 *  so the union of keys on both sides covers every change. The app decides what to do
 *  with them (e.g. show `hint` the first time a quality moves). */
export function changedQualities(prev: Bags, next: Bags, world: World): string[] {
  const ids = new Set<string>([...Object.keys(prev.run), ...Object.keys(next.run), ...Object.keys(prev.profile), ...Object.keys(next.profile)]);
  return [...ids].filter((id) => getQuality(prev, world, id) !== getQuality(next, world, id)).sort();
}
