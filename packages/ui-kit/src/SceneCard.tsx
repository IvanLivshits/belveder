import type { ComponentChildren } from "preact";

export interface SceneCardProps {
  title?: string | undefined;
  text: string;
  portraitSrc?: string | undefined;
  /** Choice list or door picker rendered under the text. */
  children?: ComponentChildren;
}

/** Bottom-third panel: title, text, then whatever interaction the scene has. */
export function SceneCard({ title, text, portraitSrc, children }: SceneCardProps) {
  return (
    <>
      {portraitSrc && <img class="portrait" src={portraitSrc} alt="" draggable={false} />}
      <section class="panel">
        <div class="panel__scroll">
          {title && <h2 class="scene__title">{title}</h2>}
          <p class="scene__text">{text}</p>
        </div>
        {children}
      </section>
    </>
  );
}
