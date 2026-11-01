export interface QualityItem {
  label: string;
  value: number;
  max?: number | undefined;
}

/** Top HUD strip with visible qualities. */
export function QualityBar({ items }: { items: QualityItem[] }) {
  return (
    <div class="hud">
      {items.map((q) => (
        <span key={q.label} class="hud__item">
          {q.label}: <b>{q.value}{q.max !== undefined ? `/${q.max}` : ""}</b>
        </span>
      ))}
    </div>
  );
}
