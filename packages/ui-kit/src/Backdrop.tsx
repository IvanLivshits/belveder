import type { ComponentChildren } from "preact";

export interface BackdropProps {
  src: string;
  /** Switches off rain/lamp overlays (e.g. indoors). */
  rain?: boolean;
  children?: ComponentChildren;
}

/** Full-screen 9:16 background with CSS rain and lamp flicker. */
export function Backdrop({ src, rain = true, children }: BackdropProps) {
  return (
    <div class="backdrop">
      <img class="backdrop__img" src={src} alt="" draggable={false} />
      {rain && <div class="backdrop__rain" />}
      <div class="backdrop__lamp" />
      <div class="backdrop__fade" />
      {children}
    </div>
  );
}
