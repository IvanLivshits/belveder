import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";

export interface LifeLineItem {
  pair: string;
  status: "fake" | "empty" | "real";
  /** `~~…~~` is struck through; the part after `→` is set in another hand. */
  text: string;
  /** Morning screen: "strike" draws the line through over ~1s, "return" also writes the new hand in after it. */
  animate?: "strike" | "return" | undefined;
}

export interface LifeProps {
  title: string;
  intro: string;
  /** Null while the content's condition does not hold. */
  footer: string | null;
  lines: LifeLineItem[];
  /** Called per kind of animation: with true when the strike (the line is crossed out) or the ink (the new hand is
   *  written) starts on the page, with false when every animation of that kind is over or the page is left meanwhile.
   *  The ink follows the strike on the lines that were exchanged. Never called when nothing animates, e.g. with
   *  reduced motion. */
  onAnimate?: ((kind: AnimationKind, active: boolean) => void) | undefined;
}

export type AnimationKind = "strike" | "ink";

/** Lines animate at the same moment, and a line's two ink parts overlap but may end a frame apart: a kind counts as
 *  over only after this quiet time. */
const SETTLE_MS = 150;
const KINDS: readonly AnimationKind[] = ["strike", "ink"];

/** Turns the page's CSS animation events into one active/idle signal per kind. */
function useAnimationActivity(onAnimate: ((kind: AnimationKind, active: boolean) => void) | undefined) {
  const state = useRef({
    strike: { running: 0, active: false, timer: undefined as ReturnType<typeof setTimeout> | undefined },
    ink: { running: 0, active: false, timer: undefined as ReturnType<typeof setTimeout> | undefined },
  });
  const callback = useRef(onAnimate);
  callback.current = onAnimate;
  const set = (kind: AnimationKind, on: boolean) => {
    const k = state.current[kind];
    if (k.active === on) return;
    k.active = on;
    callback.current?.(kind, on);
  };
  useEffect(() => () => {
    for (const kind of KINDS) { clearTimeout(state.current[kind].timer); set(kind, false); }
  }, []);
  const kindOf = (e: AnimationEvent) => KINDS.find((k) => k === e.animationName);
  const start = (e: AnimationEvent) => {
    const kind = kindOf(e);
    if (kind === undefined) return;
    const k = state.current[kind];
    k.running += 1;
    clearTimeout(k.timer);
    set(kind, true);
  };
  const end = (e: AnimationEvent) => {
    const kind = kindOf(e);
    if (kind === undefined) return;
    const k = state.current[kind];
    k.running = Math.max(0, k.running - 1);
    if (k.running === 0) k.timer = setTimeout(() => set(kind, false), SETTLE_MS);
  };
  return { onAnimationStart: start, onAnimationEnd: end, onAnimationCancel: end };
}

/** Renders `~~x~~` as struck text and `→ y` as a second hand. */
export function lifeText(text: string): ComponentChildren {
  const [before, after] = text.split("→");
  const parts = (before ?? "").split(/~~(.+?)~~/);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <s key={i}>{p}</s> : p))}
      {after !== undefined && <><span class="life__arrow" aria-hidden="true">→</span><span class="life__real">{after}</span></>}
    </>
  );
}

/** The "what I know about myself" page: one line per memory pair. */
export function Life({ title, intro, footer, lines, onAnimate }: LifeProps) {
  const animation = useAnimationActivity(onAnimate);
  return (
    <>
      <h1 class="report__title">{title}</h1>
      <p class="notebook__intro">{intro}</p>
      <ul class="life" {...animation}>
        {lines.map((l) => (
          <li key={l.pair} class={`life__line life__line--${l.status}${l.animate ? ` life__line--anim-${l.animate}` : ""}`}>{lifeText(l.text)}</li>
        ))}
      </ul>
      {footer && <p class="notebook__intro">{footer}</p>}
    </>
  );
}
