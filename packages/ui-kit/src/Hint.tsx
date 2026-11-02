import { useEffect } from "preact/hooks";
import { readingTime } from "./reading";

export interface HintProps {
  text: string;
  /** Called after `ms` (default: `readingTime(text)`) or on tap. */
  onDismiss: () => void;
  ms?: number | undefined;
  /** Paper screens (report, notebook) have no HUD, so the hint sits at the bottom there. */
  placement?: "top" | "bottom";
}

/** One-line tutorial hint under the HUD; disappears on its own or on tap. */
export function Hint({ text, onDismiss, ms, placement = "top" }: HintProps) {
  const delay = ms ?? readingTime(text);
  useEffect(() => {
    const t = setTimeout(onDismiss, delay);
    return () => clearTimeout(t);
  }, [text, onDismiss, delay]);
  return (
    <button class={`hint${placement === "bottom" ? " hint--bottom" : ""}`} type="button" onClick={onDismiss}>
      {text}
    </button>
  );
}
