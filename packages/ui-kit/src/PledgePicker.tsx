import { ChoiceList, type ChoiceItem } from "./ChoiceList";

export interface MemoryItem {
  id: string;
  label: string;
  /** Pledging now would bring something back; the envelope is highlighted. */
  canReturn?: boolean | undefined;
  /** Caption for a highlighted envelope; without it `readyLabel` is shown. */
  hint?: string | undefined;
}

export interface PledgePickerProps {
  /** Fake memories still available to pawn. */
  memories: MemoryItem[];
  onPledge: (id: string) => void;
  /** Generic caption under a highlighted envelope that has no `hint` of its own. */
  readyLabel?: string | undefined;
  /** Plain choices of the pledge storylet, e.g. "pledge the night". */
  choices: ChoiceItem[];
  onChoose: (index: number) => void;
}

/** Pledge screen: one envelope per pawnable memory, then the storylet's own choices. */
export function PledgePicker({ memories, onPledge, readyLabel, choices, onChoose }: PledgePickerProps) {
  return (
    <div class="choices">
      {memories.map((m) => (
        <button key={m.id} class={`choice choice--memory${m.canReturn ? " choice--ready" : ""}`} type="button" onClick={() => onPledge(m.id)}>
          <span><span class="choice__glyph" aria-hidden="true">✉</span> {m.label}</span>
          {m.canReturn && (m.hint ?? readyLabel) && <span class="choice__note">{m.hint ?? readyLabel}</span>}
        </button>
      ))}
      <ChoiceList choices={choices} onChoose={onChoose} />
    </div>
  );
}
