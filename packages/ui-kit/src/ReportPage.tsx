export interface ReportEntry {
  slot: string;
  label: string;
  text: string;
}

export interface ReportPageProps {
  title: string;
  entries: ReportEntry[];
  nextLabel: string;
  onNext: () => void;
  /** CSS background-image value for paper texture, e.g. `url(/ui/paper_dark.webp)`. */
  texture?: string | undefined;
  /** Small print above the title. */
  notes?: string[] | undefined;
  /** Case progress under the entries, one line each. */
  progress?: string[] | undefined;
}

/** Night report assembled from fragment slots. */
export function ReportPage({ title, entries, nextLabel, onNext, texture, notes, progress }: ReportPageProps) {
  return (
    <article class={`paper${texture ? " paper--textured" : ""}`} style={texture ? { "--paper-texture": texture } : undefined}>
      {notes?.map((n, i) => <p key={i} class="report__note">{n}</p>)}
      <h1 class="report__title">{title}</h1>
      {entries.map((e) => (
        <div key={e.slot} class="report__entry">
          <span class="report__slot">{e.label}</span>
          <p class="report__text">{e.text}</p>
        </div>
      ))}
      {progress && progress.length > 0 && (
        <div class="report__progress">
          {progress.map((p, i) => <p key={i} class="report__progress-line">{p}</p>)}
        </div>
      )}
      <div class="report__actions">
        <button class="choice choice--primary" type="button" onClick={onNext}>{nextLabel}</button>
      </div>
    </article>
  );
}
