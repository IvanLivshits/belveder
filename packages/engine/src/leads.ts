import type { World } from "@belvedere/content-schema";
import { evaluateAll } from "./conditions";
import { getQuality } from "./qualities";
import type { GameState } from "./state";
import { renderText } from "./text";

type Bags = Pick<GameState, "run" | "profile">;

export interface LeadItem {
  id: string;
  text: string;
  /** Shown under a closed lead. */
  answer: string;
  done: boolean;
}

/** Leads that have appeared (`when` holds): open ones first, then closed ones; `total` and `done` count them. */
export function leadsView(state: Bags, world: World): { open: LeadItem[]; closed: LeadItem[]; total: number; done: number } {
  const items = (world.notebook?.leads ?? [])
    .filter((l) => evaluateAll(state, world, l.when))
    .map((l): LeadItem => ({ id: l.id, text: renderText(l.text, state, world), answer: renderText(l.answer, state, world), done: evaluateAll(state, world, l.done) }));
  const closed = items.filter((l) => l.done);
  return { open: items.filter((l) => !l.done), closed, total: items.length, done: closed.length };
}

/** Locations an open lead points at: their doors (and their floors on the stairs) carry a paperclip. */
export function leadTargets(state: Bags, world: World): Set<string> {
  const out = new Set<string>();
  for (const l of world.notebook?.leads ?? []) {
    if (l.target !== undefined && evaluateAll(state, world, l.when) && !evaluateAll(state, world, l.done)) out.add(l.target);
  }
  return out;
}

/** Appends to `history.vouchers` every quality of `notebook.vouchers.names` that is set and not listed yet.
 *  Called after every effect batch, so the page can show the names in the order they were earned. */
export function recordVouchers<S extends Bags & Pick<GameState, "history">>(state: S, world: World): S {
  const names = world.notebook?.vouchers?.names;
  if (!names) return state;
  const listed = state.history.vouchers ?? [];
  const fresh = Object.keys(names).filter((q) => getQuality(state, world, q) >= 1 && !listed.includes(q));
  return fresh.length === 0 ? state : { ...state, history: { ...state.history, vouchers: [...listed, ...fresh] } };
}

/** The "who vouched for me" page: `slots` lines, names in the order they were earned, the rest `empty`.
 *  Null while the page's `when` does not hold (or the world has no such page). */
export function vouchersView(state: Bags & Pick<GameState, "history">, world: World): { title: string; lines: string[]; footer: string | null } | null {
  const page = world.notebook?.vouchers;
  if (!page || !evaluateAll(state, world, page.when)) return null;
  const earned = (state.history.vouchers ?? []).flatMap((q) => (page.names[q] !== undefined ? [page.names[q]] : []));
  const lines = Array.from({ length: Math.max(page.slots, earned.length) }, (_, i) => earned[i] ?? page.empty);
  return { title: page.title, lines, footer: page.footer ?? null };
}
