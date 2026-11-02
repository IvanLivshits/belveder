export interface QualityItem {
  label: string;
  value: number;
  max?: number | undefined;
}

/** Bounded qualities up to this size are drawn as pips; larger ones as a thin bar. */
const PIP_LIMIT = 10;

/** Top HUD strip: label in small caps, value as pips, bar or number. Pure presentation, no quality names. */
export function QualityBar({ items }: { items: QualityItem[] }) {
  return (
    <div class="hud">
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
