export interface ConfirmSheetProps {
  text: string;
  okLabel: string;
  cancelLabel: string;
  onOk: () => void;
  onCancel: () => void;
  /** Which button is highlighted as the default: "ok" (default) or "cancel" when ok is a loss the player should not hit by habit. */
  primary?: "ok" | "cancel" | undefined;
}

/** In-game confirmation over the scene (no browser dialogs): a dark sheet with two buttons. */
export function ConfirmSheet({ text, okLabel, cancelLabel, onOk, onCancel, primary = "ok" }: ConfirmSheetProps) {
  return (
    <div class="confirm" role="dialog" aria-modal="true">
      <div class="confirm__sheet">
        <p class="confirm__text">{text}</p>
        <div class="choices">
          <button class={primary === "ok" ? "choice choice--primary" : "choice"} type="button" onClick={onOk}>{okLabel}</button>
          <button class={primary === "cancel" ? "choice choice--primary" : "choice"} type="button" onClick={onCancel}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}
