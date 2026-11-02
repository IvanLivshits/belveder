export interface EndingPageProps {
  /** 9:16 image, full screen. */
  src: string;
  title: string;
  paragraphs: string[];
  epilogues: string[];
  nextLabel: string;
  onNext: () => void;
}

/** The ending: picture behind, the text scrolls up over it, epilogues set apart at the end. */
export function EndingPage({ src, title, paragraphs, epilogues, nextLabel, onNext }: EndingPageProps) {
  return (
    <div class="ending">
      <img class="ending__img" src={src} alt="" draggable={false} />
      <div class="ending__scroll">
        <div class="ending__spacer" />
        <article class="ending__body">
          <h1 class="ending__title">{title}</h1>
          {paragraphs.map((p, i) => <p key={i} class="ending__text">{p}</p>)}
          {epilogues.length > 0 && (
            <div class="ending__epilogues">
              {epilogues.map((p, i) => <p key={i} class="ending__epilogue">{p}</p>)}
            </div>
          )}
          <div class="report__actions">
            <button class="choice choice--primary" type="button" onClick={onNext}>{nextLabel}</button>
          </div>
        </article>
      </div>
    </div>
  );
}
