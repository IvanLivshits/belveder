import { Clip } from "./ChoiceList";

export interface StairsFloorItem {
  floor: number;
  /** Small label under the number, e.g. "2 хода"; omitted for the current floor. */
  cost?: string | undefined;
  /** Closed: drawn grey with a lock, cannot be walked to. */
  locked?: boolean | undefined;
  /** Paperclip: an open lead points at a door of this floor. */
  lead?: boolean | undefined;
  /** The floor the player stands on: shown in place, not a button. */
  current?: boolean | undefined;
}

export interface StairsPickerProps {
  /** Every floor including the current one, in any order; drawn top floor first. */
  floors: StairsFloorItem[];
  /** One line per closed floor: what the lock says. */
  notes: string[];
  /** Caption of the current floor's cell. */
  hereLabel: string;
  onTravel: (floor: number) => void;
  /** Free way back to the landing of the current floor; omitted when there is none. */
  backLabel?: string | undefined;
  onBack?: (() => void) | undefined;
}

/** The staircase as one screen: a cell per floor with the price of the walk, then the way back. */
export function StairsPicker({ floors, notes, hereLabel, onTravel, backLabel, onBack }: StairsPickerProps) {
  const sorted = [...floors].sort((a, b) => b.floor - a.floor);
  return (
    <div class="choices">
      <div class="stairs">
        {sorted.map((f) => (
          <button
            key={f.floor}
            type="button"
            class={`stairs__floor${f.current ? " stairs__floor--here" : ""}${f.locked ? " stairs__floor--locked" : ""}`}
            disabled={f.current || f.locked}
            onClick={() => onTravel(f.floor)}
          >
            {f.lead && <Clip />}
            <b class="stairs__num">{f.floor}</b>
            {f.locked ? (
              <svg class="stairs__lock" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6 11h12v10H6zM9 11V7a3 3 0 0 1 6 0v4" />
              </svg>
            ) : (
              <span class="stairs__cost">{f.current ? hereLabel : f.cost ?? "\u00a0"}</span>
            )}
          </button>
        ))}
      </div>
      {notes.map((n, i) => <p key={i} class="stairs__note">{n}</p>)}
      {onBack && backLabel && <button class="choice" type="button" onClick={onBack}><span>{backLabel}</span></button>}
    </div>
  );
}
