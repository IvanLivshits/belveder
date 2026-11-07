import { RESERVED_QUALITIES, type World } from "@belvedere/content-schema";
import { getQuality, setQuality } from "./qualities";
import type { Bags } from "./conditions";

/** Sets profile `found.<id> = 1` for every evidence item whose run flag is 1. Called after
 *  every effect batch, so the folder remembers a find even after the night's run bag is gone. */
export function recordEvidence<S extends Bags>(state: S, world: World): S {
  let next = state;
  for (const item of world.evidence.items) {
    const key = RESERVED_QUALITIES.foundPrefix + item.id;
    if (getQuality(next, world, item.flag) === 1 && getQuality(next, world, key) !== 1) next = setQuality(next, world, key, 1);
  }
  return next;
}

export interface EvidenceCard {
  id: string;
  title: string;
  image: string | undefined;
  text: string;
  /** The run flag is 1 right now, i.e. the find happened this night. */
  tonight: boolean;
}

/** Evidence folder for the renderer: found items in `order`, plus how many are still unfound. */
export function evidenceView(state: Bags, world: World): { items: EvidenceCard[]; locked: number } {
  const found = world.evidence.items.filter((item) =>
    getQuality(state, world, RESERVED_QUALITIES.foundPrefix + item.id) === 1 || getQuality(state, world, item.flag) === 1);
  const items = [...found]
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ id: item.id, title: item.title, image: item.image, text: item.text, tonight: getQuality(state, world, item.flag) === 1 }));
  return { items, locked: world.evidence.items.length - found.length };
}
