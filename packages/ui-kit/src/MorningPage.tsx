import { Life, type LifeLineItem } from "./Life";

export interface MorningPageProps {
  title: string;
  /** Life page after the night; lines changed tonight carry `animate`. */
  life: { title: string; intro: string; footer: string | null; lines: LifeLineItem[] };
  nextLabel: string;
  onNext: () => void;
  texture?: string | undefined;
}

/** Between the report and the next night: the life page with tonight's changes drawn in. */
export function MorningPage({ title, life, nextLabel, onNext, texture }: MorningPageProps) {
  return (
    <article class={`paper paper--morning${texture ? " paper--textured" : ""}`} style={texture ? { "--paper-texture": texture } : undefined}>
      <h1 class="morning__title">{title}</h1>
      <Life {...life} />
      <div class="report__actions">
        <button class="choice choice--primary" type="button" onClick={onNext}>{nextLabel}</button>
      </div>
    </article>
  );
}
