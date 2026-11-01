import type { ChoiceItem } from "./ChoiceList";

export interface DoorPickerProps {
  /** Exactly three in content order: tenant door, service door, stairs. */
  doors: ChoiceItem[];
  onChoose: (index: number) => void;
}

const GLYPHS = ["🚪", "🔧", "🪜"];

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
          <span class="door__glyph" aria-hidden="true">{d.available ? GLYPHS[i] ?? "🚪" : "🔒"}</span>
          <span>{d.text}</span>
        </button>
      ))}
    </div>
  );
}
