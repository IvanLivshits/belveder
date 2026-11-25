export interface TipJarProps {
  text: string;
  options: { id: string; label: string; price: string }[];
  onTip: (id: string) => void;
  /** A payment is open: the buttons wait. */
  busy: boolean;
  /** Shown instead of the buttons once a tip went through. */
  thanks: string | null;
}

/** A quiet block at the bottom of a paper page: one line and a few amounts. Nothing in the game depends on it. */
export function TipJar({ text, options, onTip, busy, thanks }: TipJarProps) {
  return (
    <section class="tips">
      <p class="tips__text">{thanks ?? text}</p>
      {thanks === null && (
        <div class="tips__options">
          {options.map((o) => (
            <button key={o.id} class="choice tips__option" type="button" disabled={busy} onClick={() => onTip(o.id)}>
              <span>{o.label}</span>
              <span class="tips__price">{o.price}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
