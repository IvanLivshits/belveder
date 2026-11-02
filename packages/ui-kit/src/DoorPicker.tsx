import type { ChoiceItem } from "./ChoiceList";

export interface DoorPickerProps {
  /** Exactly three in content order: tenant door, service door, stairs. */
  doors: ChoiceItem[];
  onChoose: (index: number) => void;
}

/* Line icons in currentColor so they follow the theme; emoji differ per platform and clash with the palette. */
const ICONS = {
  door: <path d="M6 3h12v18H6zM6 21H4M18 21h2M14.5 12.5a1 1 0 1 0 0-.01" />,
  key: <path d="M8 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm3-3 9 0m-3 0v3m-3-3v2" />,
  stairs: <path d="M3 20h5v-4h4v-4h4V8h5M3 20V4" />,
  lock: <path d="M6 11h12v10H6zM9 11V7a3 3 0 0 1 6 0v4" />,
};
const ORDER: (keyof typeof ICONS)[] = ["door", "key", "stairs"];

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg class="door__glyph" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/** Three doors side by side; locked doors stay visible but disabled. */
export function DoorPicker({ doors, onChoose }: DoorPickerProps) {
  return (
    <div class="doors">
      {doors.map((d, i) => (
        <button
          key={d.index}
          type="button"
          class={`door${d.available ? "" : " door--locked"}`}
          disabled={!d.available}
          onClick={() => d.available && onChoose(d.index)}
        >
          <Icon name={d.available ? ORDER[i] ?? "door" : "lock"} />
          <span>{d.text}</span>
          <span class="door__cost">{d.cost ?? "\u00a0"}</span>
        </button>
      ))}
    </div>
  );
}
