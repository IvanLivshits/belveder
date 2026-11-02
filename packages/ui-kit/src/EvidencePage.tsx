export interface EvidenceCardItem {
  id: string;
  title: string;
  /** Resolved image URL; cards without a photo show a blank frame. */
  image: string | undefined;
  text: string;
  /** Found this night. */
  tonight: boolean;
}

export interface EvidencePageProps {
  title: string;
  items: EvidenceCardItem[];
  /** Still unfound. */
  locked: number;
  /** Open card, or null for the list. */
  selected: string | null;
  onSelect: (id: string | null) => void;
  onBack: () => void;
  tonightLabel: string;
  lockedLabel: (n: number) => string;
  backLabel: string;
  texture?: string | undefined;
}

/** Nick's evidence folder: a list of cards, each opening a page with the photo and his note. */
export function EvidencePage({ title, items, locked, selected, onSelect, onBack, tonightLabel, lockedLabel, backLabel, texture }: EvidencePageProps) {
  const open = selected === null ? undefined : items.find((i) => i.id === selected);
  const style = texture ? { "--paper-texture": texture } : undefined;
  if (open) {
    return (
      <article class={`paper paper--evidence${texture ? " paper--textured" : ""}`} style={style}>
        <div class="evidence__photo">
          {open.image ? <img src={open.image} alt="" draggable={false} /> : <span />}
        </div>
        <h1 class="evidence__title">{open.title}{open.tonight && <span class="evidence__tag">{tonightLabel}</span>}</h1>
        {open.text.split(/\n\s*\n/).map((para, i) => <p key={i} class="report__text">{para.trim()}</p>)}
        <div class="report__actions">
          <button class="choice choice--primary" type="button" onClick={() => onSelect(null)}>{backLabel}</button>
        </div>
      </article>
    );
  }
  return (
    <article class={`paper${texture ? " paper--textured" : ""}`} style={style}>
      <h1 class="report__title">{title}</h1>
      <div class="evidence">
        {items.map((i) => (
          <button key={i.id} class="evidence__card" type="button" onClick={() => onSelect(i.id)}>
            <span class="evidence__thumb">{i.image && <img src={i.image} alt="" draggable={false} />}</span>
            <span class="evidence__name">{i.title}</span>
            {i.tonight && <span class="evidence__tag">{tonightLabel}</span>}
          </button>
        ))}
      </div>
      {locked > 0 && <p class="notebook__locked">{lockedLabel(locked)}</p>}
      <div class="report__actions">
        <button class="choice choice--primary" type="button" onClick={onBack}>{backLabel}</button>
      </div>
    </article>
  );
}
