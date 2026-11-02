export interface ConfirmSheetProps {
  text: string;
  okLabel: string;
  cancelLabel: string;
  onOk: () => void;
  onCancel: () => void;
}

/** In-game confirmation over the scene (no browser dialogs): a dark sheet with two buttons. */
export function ConfirmSheet({ text, okLabel, cancelLabel, onOk, onCancel }: ConfirmSheetProps) {
  return (
    <div class="confirm" role="dialog" aria-modal="true">
      <div class="confirm__sheet">
        <p class="confirm__text">{text}</p>
        <div class="choices">
          <button class="choice choice--primary" type="button" onClick={onOk}>{okLabel}</button>
          <button class="choice" type="button" onClick={onCancel}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}
