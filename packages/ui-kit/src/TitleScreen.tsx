export interface TitleScreenProps {
  coverSrc: string;
  canContinue: boolean;
  nights: number;
  onContinue: () => void;
  onNewNight: () => void;
  /** Sound switch under the buttons, e.g. "Звук: вкл". */
  soundLabel: string;
  onToggleSound: () => void;
}

export function TitleScreen({ coverSrc, canContinue, nights, onContinue, onNewNight, soundLabel, onToggleSound }: TitleScreenProps) {
  return (
    <div class="title">
      <img class="title__cover" src={coverSrc} alt="" draggable={false} />
      <div class="title__actions">
        {canContinue && (
          <button class="choice choice--primary" type="button" onClick={onContinue}>Продолжить ночь</button>
        )}
        <button class={`choice${canContinue ? "" : " choice--primary"}`} type="button" onClick={onNewNight}>
          {nights > 0 ? `Новая ночь (${nights + 1})` : "Начать"}
        </button>
      </div>
      <button class="title__sound" type="button" onClick={onToggleSound}>{soundLabel}</button>
      {nights > 0 && <span class="title__hint">Ночей пройдено: {nights}</span>}
    </div>
  );
}
