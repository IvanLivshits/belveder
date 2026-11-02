export interface ChoiceItem {
  index: number;
  text: string;
  available: boolean;
  /** Small label on the right, e.g. "1 ход"; omitted for free choices. */
  cost?: string | undefined;
}

export interface ChoiceListProps {
  choices: ChoiceItem[];
  onChoose: (index: number) => void;
}

/** Vertical list of choices; unavailable ones are hidden. */
export function ChoiceList({ choices, onChoose }: ChoiceListProps) {
  return (
    <div class="choices">
      {choices.filter((c) => c.available).map((c) => (
        <button key={c.index} class="choice" type="button" onClick={() => onChoose(c.index)}>
          <span>{c.text}</span>
          {c.cost && <span class="choice__cost">{c.cost}</span>}
        </button>
      ))}
    </div>
  );
}
