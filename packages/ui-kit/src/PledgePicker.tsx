import { ChoiceList, type ChoiceItem } from "./ChoiceList";

export interface MemoryItem {
  id: string;
  label: string;
}

export interface PledgePickerProps {
  /** Fake memories still available to pawn. */
  memories: MemoryItem[];
  onPledge: (id: string) => void;
  /** Plain choices of the pledge storylet, e.g. "pledge the night". */
  choices: ChoiceItem[];
  onChoose: (index: number) => void;
}

/** Pledge screen: one button per pawnable memory, then the storylet's own choices. */
export function PledgePicker({ memories, onPledge, choices, onChoose }: PledgePickerProps) {
  return (
    <div class="choices">
      {memories.map((m) => (
        <button key={m.id} class="choice choice--memory" type="button" onClick={() => onPledge(m.id)}>
          <span class="choice__glyph" aria-hidden="true">✉</span> {m.label}
        </button>
      ))}
      <ChoiceList choices={choices} onChoose={onChoose} />
    </div>
  );
}
