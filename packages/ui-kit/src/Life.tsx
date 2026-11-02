import type { ComponentChildren } from "preact";

export interface LifeLineItem {
  pair: string;
  status: "fake" | "empty" | "real";
  /** `~~…~~` is struck through; the part after `→` is set in another hand. */
  text: string;
  /** Morning screen: "strike" draws the line through over ~1s, "return" also writes the new hand in after it. */
  animate?: "strike" | "return" | undefined;
}

export interface LifeProps {
  title: string;
  intro: string;
  /** Null while the content's condition does not hold. */
  footer: string | null;
  lines: LifeLineItem[];
}

/** Renders `~~x~~` as struck text and `→ y` as a second hand. */
export function lifeText(text: string): ComponentChildren {
  const [before, after] = text.split("→");
  const parts = (before ?? "").split(/~~(.+?)~~/);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <s key={i}>{p}</s> : p))}
      {after !== undefined && <><span class="life__arrow" aria-hidden="true">→</span><span class="life__real">{after}</span></>}
    </>
  );
}

/** The "what I know about myself" page: one line per memory pair. */
export function Life({ title, intro, footer, lines }: LifeProps) {
  return (
    <>
      <h1 class="report__title">{title}</h1>
      <p class="notebook__intro">{intro}</p>
      <ul class="life">
        {lines.map((l) => (
          <li key={l.pair} class={`life__line life__line--${l.status}${l.animate ? ` life__line--anim-${l.animate}` : ""}`}>{lifeText(l.text)}</li>
        ))}
      </ul>
      {footer && <p class="notebook__intro">{footer}</p>}
    </>
  );
}
