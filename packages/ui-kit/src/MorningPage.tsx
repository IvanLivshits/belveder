import { type AnimationKind, Life, type LifeLineItem } from "./Life";

export interface MorningPageProps {
  title: string;
  /** Life page after the night; lines changed tonight carry `animate`. */
  life: { title: string; intro: string; footer: string | null; lines: LifeLineItem[] };
  /** One-line summary of the night under the title. */
  notes?: string[] | undefined;
  nextLabel: string;
  onNext: () => void;
  texture?: string | undefined;
  /** Per animation kind, true while it runs and false when it is over: the app plays the pencil meanwhile. */
  onAnimate?: ((kind: AnimationKind, active: boolean) => void) | undefined;
}

/** Between the report and the next night: the life page with tonight's changes drawn in. */
export function MorningPage({ title, life, notes, nextLabel, onNext, texture, onAnimate }: MorningPageProps) {
  return (
    <article class={`paper paper--morning${texture ? " paper--textured" : ""}`} style={texture ? { "--paper-texture": texture } : undefined}>
      <h1 class="morning__title">{title}</h1>
      {notes?.map((n, i) => <p key={i} class="morning__note">{n}</p>)}
      <Life {...life} onAnimate={onAnimate} />
      <div class="report__actions">
        <button class="choice choice--primary" type="button" onClick={onNext}>{nextLabel}</button>
      </div>
    </article>
  );
}
