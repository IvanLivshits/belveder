import { Life, type LifeLineItem } from "./Life";

export type { LifeLineItem } from "./Life";

export interface NotebookPageItem {
  id: string;
  title: string;
  text: string;
  rule: string;
}

export interface NotebookPageProps {
  life: { title: string; intro: string; footer: string | null; lines: LifeLineItem[] };
  pages: NotebookPageItem[];
  /** Pages still closed. */
  locked: number;
  ruleLabel: string;
  lockedLabel: (n: number) => string;
  backLabel: string;
  onBack: () => void;
  /** Small link at the very bottom (settings live here, away from the night loop). */
  resetLabel?: string | undefined;
  onReset?: (() => void) | undefined;
  texture?: string | undefined;
}

/** Nick's notebook: the life page on top, then every open reference page. */
export function NotebookPage({ life, pages, locked, ruleLabel, lockedLabel, backLabel, onBack, resetLabel, onReset, texture }: NotebookPageProps) {
  return (
    <article class={`paper${texture ? " paper--textured" : ""}`} style={texture ? { "--paper-texture": texture } : undefined}>
      <Life {...life} />
      {pages.map((p) => (
        <section key={p.id} class="notebook__page">
          <h2 class="notebook__title">{p.title}</h2>
          <p class="report__text">{p.text}</p>
          <p class="notebook__rule"><span class="report__slot">{ruleLabel}</span>{p.rule}</p>
        </section>
      ))}
      {locked > 0 && <p class="notebook__locked">{lockedLabel(locked)}</p>}
      <div class="report__actions">
        <button class="choice choice--primary" type="button" onClick={onBack}>{backLabel}</button>
      </div>
      {onReset && resetLabel && <button class="title__reset notebook__reset" type="button" onClick={onReset}>{resetLabel}</button>}
    </article>
  );
}
