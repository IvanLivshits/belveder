import { useEffect } from "preact/hooks";

export interface HintProps {
  text: string;
  /** Called after `ms` or on tap. */
  onDismiss: () => void;
  ms?: number;
  /** Paper screens (report, notebook) have no HUD, so the hint sits at the bottom there. */
  placement?: "top" | "bottom";
}

/** One-line tutorial hint under the HUD; disappears on its own or on tap. */
export function Hint({ text, onDismiss, ms = 4000, placement = "top" }: HintProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, ms);
    return () => clearTimeout(t);
  }, [text, onDismiss, ms]);
  return (
    <button class={`hint${placement === "bottom" ? " hint--bottom" : ""}`} type="button" onClick={onDismiss}>
      {text}
    </button>
  );
}
