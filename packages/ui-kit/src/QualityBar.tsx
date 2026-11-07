export interface QualityItem {
  label: string;
  value: number;
  max?: number | undefined;
  /** Shown instead of the number/pips/bar, e.g. a wall-clock time derived from the value. */
  display?: string | undefined;
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
  /** Opens the evidence folder; the button is rendered only when given. */
  onEvidence?: (() => void) | undefined;
  evidenceBadge?: boolean | undefined;
  evidenceLabel?: string | undefined;
  /** Repeats tonight's rumor; the button is rendered only when given. */
  onRumor?: (() => void) | undefined;
  rumorLabel?: string | undefined;
}

/** Top HUD strip: label in small caps, value as pips, bar or number. Pure presentation, no quality names. */
export function QualityBar({ items, onNotebook, badge, notebookLabel, onEvidence, evidenceBadge, evidenceLabel, onRumor, rumorLabel }: QualityBarProps) {
  return (
    <div class="hud">
      {onNotebook && (
        <button class={`hud__book${badge ? " hud__book--badge" : ""}`} type="button" onClick={onNotebook} aria-label={notebookLabel ?? "notebook"}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11M9 8h5" />
          </svg>
        </button>
      )}
      {onEvidence && (
        <button class={`hud__book hud__folder${evidenceBadge ? " hud__book--badge" : ""}`} type="button" onClick={onEvidence} aria-label={evidenceLabel ?? "evidence"}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 11h18" />
          </svg>
        </button>
      )}
      {onRumor && (
        <button class="hud__book hud__folder" type="button" onClick={onRumor} aria-label={rumorLabel ?? "rumor"} title={rumorLabel}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 5h16v11H11l-4 3.5V16H4zM8 9h8M8 12h5" />
          </svg>
        </button>
      )}
      {items.map((q) => (
        <span key={q.label} class={`hud__item${q.display !== undefined ? " hud__item--whole" : ""}`}>
          <span class="hud__label">{q.label}</span>
          {q.display !== undefined ? (
            <b class="hud__num">{q.display}</b>
          ) : q.max === undefined ? (
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
