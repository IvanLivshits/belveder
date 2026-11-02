export interface TitleScreenProps {
  coverSrc: string;
  canContinue: boolean;
  nights: number;
  onContinue: () => void;
  onNewNight: () => void;
}

export function TitleScreen({ coverSrc, canContinue, nights, onContinue, onNewNight }: TitleScreenProps) {
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
      {nights > 0 && <span class="title__hint">Ночей пройдено: {nights}</span>}
    </div>
  );
}
