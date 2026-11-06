import { Life, type LifeLineItem } from "./Life";

export type { LifeLineItem } from "./Life";

export interface NotebookPageItem {
  id: string;
  title: string;
  text: string;
  rule: string;
}

export interface LeadItem {
  id: string;
  text: string;
  /** Written under a closed lead. */
  answer: string;
}

export interface NotebookTab {
  id: string;
  label: string;
  /** Unread dot. */
  badge: boolean;
}

export interface NotebookPageProps {
  life: { title: string; intro: string; footer: string | null; lines: LifeLineItem[] };
  pages: NotebookPageItem[];
  /** Pages still closed. */
  locked: number;
  /** Tab strip; omitted when the notebook has a single section. The tab with id `leads` shows leads and vouchers, any other the pages. */
  tabs?: NotebookTab[] | undefined;
  tab?: string | undefined;
  onTab?: ((id: string) => void) | undefined;
  /** Open questions first, then the closed ones struck through with their answers. */
  leads?: { open: LeadItem[]; closed: LeadItem[]; emptyLabel: string } | undefined;
  /** "Who vouched for me": a fixed number of lines, filled in order; null until the page opens. */
  vouchers?: { title: string; lines: string[]; footer: string | null } | null | undefined;
  ruleLabel: string;
  lockedLabel: (n: number) => string;
  backLabel: string;
  onBack: () => void;
  /** Small link at the very bottom (settings live here, away from the night loop). */
  resetLabel?: string | undefined;
  onReset?: (() => void) | undefined;
  texture?: string | undefined;
}

/** Nick's notebook: leads (and who vouched) on one tab; the life page and every open reference page on the other. */
export function NotebookPage({ life, pages, locked, tabs, tab, onTab, leads, vouchers, ruleLabel, lockedLabel, backLabel, onBack, resetLabel, onReset, texture }: NotebookPageProps) {
  const showLeads = leads !== undefined && tab === "leads";
  return (
    <article class={`paper${texture ? " paper--textured" : ""}`} style={texture ? { "--paper-texture": texture } : undefined}>
      {tabs && tabs.length > 1 && (
        <nav class="tabs">
          {tabs.map((t) => (
            <button key={t.id} type="button" class={`tabs__tab${t.id === tab ? " tabs__tab--on" : ""}${t.badge ? " tabs__tab--badge" : ""}`} onClick={() => onTab?.(t.id)}>{t.label}</button>
          ))}
        </nav>
      )}
      {showLeads ? (
        <>
          <ul class="leads">
            {leads.open.map((l) => <li key={l.id} class="leads__lead">{l.text}</li>)}
            {leads.closed.map((l) => (
              <li key={l.id} class="leads__lead leads__lead--done">
                <s>{l.text}</s>
                <span class="leads__answer">{l.answer}</span>
              </li>
            ))}
          </ul>
          {leads.open.length + leads.closed.length === 0 && <p class="notebook__intro">{leads.emptyLabel}</p>}
          {vouchers && (
            <section class="notebook__page">
              <h2 class="notebook__title">{vouchers.title}</h2>
              <ol class="vouchers">
                {vouchers.lines.map((line, i) => <li key={i} class="vouchers__line">{line}</li>)}
              </ol>
              {vouchers.footer && <p class="notebook__rule">{vouchers.footer}</p>}
            </section>
          )}
        </>
      ) : (
        <>
          <Life {...life} />
          {pages.map((p) => (
            <section key={p.id} class="notebook__page">
              <h2 class="notebook__title">{p.title}</h2>
              <p class="report__text">{p.text}</p>
              <p class="notebook__rule"><span class="report__slot">{ruleLabel}</span>{p.rule}</p>
            </section>
          ))}
          {locked > 0 && <p class="notebook__locked">{lockedLabel(locked)}</p>}
        </>
      )}
      <div class="report__actions">
        <button class="choice choice--primary" type="button" onClick={onBack}>{backLabel}</button>
      </div>
      {onReset && resetLabel && <button class="title__reset notebook__reset" type="button" onClick={onReset}>{resetLabel}</button>}
    </article>
  );
}
