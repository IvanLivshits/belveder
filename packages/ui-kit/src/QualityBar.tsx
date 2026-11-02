export interface QualityItem {
  label: string;
  value: number;
  max?: number | undefined;
}

/** Bounded qualities up to this size are drawn as pips; larger ones as a thin bar. */
const PIP_LIMIT = 10;

export interface QualityBarProps {
  items: QualityItem[];
  /** Opens the notebook; the button is rendered only when given. */
  onNotebook?: (() => void) | undefined;
  /** Unread dot on the notebook icon. */
  badge?: boolean | undefined;
  notebookLabel?: string | undefined;
}

/** Top HUD strip: label in small caps, value as pips, bar or number. Pure presentation, no quality names. */
export function QualityBar({ items, onNotebook, badge, notebookLabel }: QualityBarProps) {
  return (
    <div class="hud">
      {onNotebook && (
        <button class={`hud__book${badge ? " hud__book--badge" : ""}`} type="button" onClick={onNotebook} aria-label={notebookLabel ?? "notebook"}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11M9 8h5" />
          </svg>
        </button>
      )}
      {items.map((q) => (
        <span key={q.label} class="hud__item">
          <span class="hud__label">{q.label}</span>
          {q.max === undefined ? (
            <b class="hud__num">{q.value}</b>
          ) : q.max <= PIP_LIMIT ? (
            <span class="hud__pips" role="img" aria-label={`${q.value} из ${q.max}`}>
              {Array.from({ length: q.max }, (_, i) => (
                <i key={i} class={i < q.value ? "hud__pip hud__pip--on" : "hud__pip"} />
              ))}
            </span>
          ) : (
            <span class="hud__bar" role="img" aria-label={`${q.value} из ${q.max}`}>
              <b class="hud__num">{q.value}<small>/{q.max}</small></b>
              <i class="hud__fill" style={{ width: `${Math.min(100, (100 * q.value) / q.max)}%` }} />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
