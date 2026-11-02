import type { ComponentChildren } from "preact";

export interface LifeLineItem {
  pair: string;
  status: "fake" | "empty" | "real";
  /** `~~…~~` is struck through; the part after `→` is set in another hand. */
  text: string;
}

export interface NotebookPageItem {
  id: string;
  title: string;
  text: string;
  rule: string;
}

export interface NotebookPageProps {
  life: { title: string; intro: string; footer: string; lines: LifeLineItem[] };
  pages: NotebookPageItem[];
  /** Pages still closed. */
  locked: number;
  ruleLabel: string;
  lockedLabel: (n: number) => string;
  backLabel: string;
  onBack: () => void;
  texture?: string | undefined;
}

/** Renders `~~x~~` as struck text and `→ y` as a second hand. */
function lifeText(text: string): ComponentChildren {
  const [before, after] = text.split("→");
  const parts = (before ?? "").split(/~~(.+?)~~/);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <s key={i}>{p}</s> : p))}
      {after !== undefined && <><span aria-hidden="true">→</span><span class="life__real">{after}</span></>}
    </>
  );
}

/** Nick's notebook: the life page on top, then every open reference page. */
export function NotebookPage({ life, pages, locked, ruleLabel, lockedLabel, backLabel, onBack, texture }: NotebookPageProps) {
  return (
    <article class={`paper${texture ? " paper--textured" : ""}`} style={texture ? { "--paper-texture": texture } : undefined}>
      <h1 class="report__title">{life.title}</h1>
      <p class="notebook__intro">{life.intro}</p>
      <ul class="life">
        {life.lines.map((l) => <li key={l.pair} class={`life__line life__line--${l.status}`}>{lifeText(l.text)}</li>)}
      </ul>
      <p class="notebook__intro">{life.footer}</p>
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
    </article>
  );
}
