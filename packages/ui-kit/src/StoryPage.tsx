export type StorySectionItem =
  | { kind: "opening"; text: string }
  | { kind: "night"; night: number; paragraphs: string[] }
  | { kind: "pledged_note"; text: string }
  | { kind: "litany"; intro: string; text: string }
  | { kind: "ending"; title: string; paragraphs: string[] }
  | { kind: "epilogues"; texts: string[] }
  | { kind: "closing"; text: string };

export interface StoryPageProps {
  title: string;
  sections: StorySectionItem[];
  nightLabel: (n: number) => string;
  nextLabel: string;
  onNext: () => void;
  texture?: string | undefined;
}

/** The whole case as one long paper page: the nights' reports in order, the price paid, the ending. */
export function StoryPage({ title, sections, nightLabel, nextLabel, onNext, texture }: StoryPageProps) {
  return (
    <article class={`paper paper--story${texture ? " paper--textured" : ""}`} style={texture ? { "--paper-texture": texture } : undefined}>
      <h1 class="report__title">{title}</h1>
      {sections.map((s, i) => {
        switch (s.kind) {
          case "opening": return <p key={i} class="story__opening">{s.text}</p>;
          case "night": return (
            <section key={i} class="story__night">
              <h2 class="story__night-title">{nightLabel(s.night)}</h2>
              {s.paragraphs.map((p, j) => <p key={j} class="report__text story__para">{p}</p>)}
            </section>
          );
          case "pledged_note": return <p key={i} class="story__note">{s.text}</p>;
          case "litany": return (
            <section key={i} class="story__litany">
              <p class="story__note">{s.intro}</p>
              <p class="report__text">{s.text}</p>
            </section>
          );
          case "ending": return (
            <section key={i} class="story__ending">
              <h2 class="notebook__title">{s.title}</h2>
              {s.paragraphs.map((p, j) => <p key={j} class="report__text">{p}</p>)}
            </section>
          );
          case "epilogues": return (
            <section key={i} class="ending__epilogues">
              {s.texts.map((p, j) => <p key={j} class="ending__epilogue">{p}</p>)}
            </section>
          );
          case "closing": return <p key={i} class="story__closing">{s.text}</p>;
        }
      })}
      <div class="report__actions">
        <button class="choice choice--primary" type="button" onClick={onNext}>{nextLabel}</button>
      </div>
    </article>
  );
}
