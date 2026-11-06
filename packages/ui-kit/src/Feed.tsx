export type FeedEntryItem =
  | {
      kind: "line";
      /** Small-caps name before the line; empty for the narrator. */
      label: string;
      color: string | null;
      /** narrator: muted, no name. inner: the inner voice, italic. speech: a character. */
      style: "narrator" | "inner" | "speech";
      text: string;
    }
  /** The player's own pick, as it fell into the feed. */
  | { kind: "pick"; mode: "say" | "do" | "plain"; text: string };

/** A choice as written on its button and in the feed: "— line" for speech, "[action]" for an action. */
export function pickText(mode: "say" | "do" | "plain", text: string): string {
  return mode === "say" ? `— ${text}` : mode === "do" ? `[${text}]` : text;
}

export interface FeedProps {
  entries: FeedEntryItem[];
}

/** The scene as a running transcript: one short line per speaker, the player's picks in between. */
export function Feed({ entries }: FeedProps) {
  return (
    <div class="feed">
      {entries.map((e, i) =>
        e.kind === "pick" ? (
          <p key={i} class="line line--pick">{pickText(e.mode, e.text)}</p>
        ) : (
          <p key={i} class={`line line--${e.style}`}>
            {e.label && <span class="line__who" style={e.color ? { color: e.color } : undefined}>{e.label}</span>}
            {e.text}
          </p>
        ),
      )}
    </div>
  );
}
