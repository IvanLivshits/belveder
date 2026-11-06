import { pickText } from "./Feed";

export interface ChoiceItem {
  index: number;
  text: string;
  available: boolean;
  /** say: the player's line ("— …"). do: an action ("[…]"). plain (default): a bare label. */
  mode?: "say" | "do" | "plain" | undefined;
  /** Small label on the right, e.g. "1 ход"; omitted for free choices. */
  cost?: string | undefined;
  /** Paperclip: an open lead points where this choice goes. */
  lead?: boolean | undefined;
}

export interface ChoiceListProps {
  choices: ChoiceItem[];
  onChoose: (index: number) => void;
}

/** The notebook's paperclip, in currentColor. */
export function Clip() {
  return (
    <svg class="clip" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M8 12.5l6.2-6.2a2.6 2.6 0 0 1 3.7 3.7l-7.6 7.6a4.3 4.3 0 0 1-6.1-6.1L11 4.7" />
    </svg>
  );
}

/** Vertical list of choices; unavailable ones are hidden. */
export function ChoiceList({ choices, onChoose }: ChoiceListProps) {
  return (
    <div class="choices">
      {choices.filter((c) => c.available).map((c) => (
        <button key={c.index} class={`choice${c.mode === "do" ? " choice--do" : ""}`} type="button" onClick={() => onChoose(c.index)}>
          <span>{pickText(c.mode ?? "plain", c.text)}</span>
          {(c.lead || c.cost) && <span class="choice__cost">{c.lead && <Clip />}{c.cost}</span>}
        </button>
      ))}
    </div>
  );
}
