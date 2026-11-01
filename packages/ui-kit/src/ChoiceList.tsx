export interface ChoiceItem {
  index: number;
  text: string;
  available: boolean;
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
          {c.text}
        </button>
      ))}
    </div>
  );
}
