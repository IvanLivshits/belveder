import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { Feed, type FeedEntryItem } from "./Feed";
import { lineDelay } from "./reading";

export interface SceneCardProps {
  title?: string | undefined;
  /** The whole feed of this place; only the first `shown` entries are on screen. */
  entries: FeedEntryItem[];
  shown: number;
  /** Asks for more entries to be shown: the next one after a pause, all of them on a tap. */
  onReveal: (shown: number) => void;
  /** Choices, doors, floors: rendered under the feed once every entry is on screen. */
  children?: ComponentChildren;
}

/** Bottom panel: title, the feed appearing line by line (a tap shows the rest at once), then the scene's interaction. */
export function SceneCard({ title, entries, shown, onReveal, children }: SceneCardProps) {
  const panel = useRef<HTMLElement>(null);
  const settled = shown >= entries.length;
  useEffect(() => {
    if (settled) return;
    const prev = entries[shown - 1];
    const t = setTimeout(() => onReveal(shown + 1), prev ? lineDelay(prev.text) : 0);
    return () => clearTimeout(t);
  }, [shown, entries, settled, onReveal]);
  // Keep the newest line (and the choices under it) in view; older lines stay above, within reach of a scroll.
  useEffect(() => {
    const el = panel.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown, settled]);
  return (
    <section class="panel" ref={panel} onClick={settled ? undefined : () => onReveal(entries.length)}>
      <div class="panel__scroll">
        {title && <h2 class="scene__title">{title}</h2>}
        <Feed entries={entries.slice(0, shown)} />
      </div>
      {settled && children}
    </section>
  );
}
