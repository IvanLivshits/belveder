import type { World } from "@belvedere/content-schema";
import { evaluateAll } from "./conditions";
import { getQuality } from "./qualities";
import type { GameState } from "./state";
import { renderText } from "./text";

type Bags = Pick<GameState, "run" | "profile">;

export type LifeStatus = "fake" | "empty" | "real";

/** One line of the "what I know about myself" page, per memory pair. */
export interface LifeLine {
  pair: string;
  status: LifeStatus;
  /** The state's template with `{label_fake}` / `{label_real}` filled in. */
  text: string;
}

export function lifeStatus(state: Bags, world: World, pairId: string): LifeStatus {
  const pair = world.memories.find((m) => m.id === pairId);
  if (!pair) return "fake";
  if (getQuality(state, world, pair.real) === 1) return "real";
  return getQuality(state, world, pair.fake) === 1 ? "fake" : "empty";
}

/** Notebook contents for the renderer: open pages (conditions hold), how many are still
 *  closed, and the life page built from memory pairs (footer null until its `when` holds).
 *  Null when the world has no notebook. */
export function notebookView(state: Bags, world: World) {
  const nb = world.notebook;
  if (!nb) return null;
  const open = nb.pages.filter((p) => evaluateAll(state, world, p.when));
  return {
    pages: open.map((p) => ({ id: p.id, title: p.title, text: renderText(p.text, state, world), rule: renderText(p.rule, state, world) })),
    locked: nb.pages.length - open.length,
    life: {
      title: nb.life.title,
      intro: nb.life.intro,
      footer: evaluateAll(state, world, nb.life.footer.when) ? nb.life.footer.text : null,
      lines: world.memories.map((pair): LifeLine => {
        const status = lifeStatus(state, world, pair.id);
        const text = nb.life.states[status].replace(/\{label_fake\}/g, pair.label_fake).replace(/\{label_real\}/g, pair.label_real);
        return { pair: pair.id, status, text };
      }),
    },
  };
}
export type NotebookView = NonNullable<ReturnType<typeof notebookView>>;
