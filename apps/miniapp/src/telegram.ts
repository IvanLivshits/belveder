/** The only file that touches window.Telegram.WebApp. Everything else uses this adapter. */

interface CloudStorageApi {
  setItem(key: string, value: string, cb?: (err: string | null, ok?: boolean) => void): void;
  getItems(keys: string[], cb: (err: string | null, values?: Record<string, string>) => void): void;
  removeItems(keys: string[], cb?: (err: string | null, ok?: boolean) => void): void;
  getKeys(cb: (err: string | null, keys?: string[]) => void): void;
}

interface BackButtonApi {
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
}

interface WebAppApi {
  initData: string;
  colorScheme: "light" | "dark";
  ready(): void;
  expand(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  onEvent(event: string, cb: () => void): void;
  BackButton: BackButtonApi;
  CloudStorage: CloudStorageApi;
  HapticFeedback?: { impactOccurred(style: "light" | "medium" | "heavy"): void };
}

declare global {
  interface Window { Telegram?: { WebApp?: WebAppApi } }
}

const webApp = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;

/** True only inside a real Telegram client (initData is empty in a plain browser). */
export const isTelegram = Boolean(webApp && webApp.initData);

export function initTelegram(): void {
  if (!webApp || !isTelegram) return;
  webApp.ready();
  webApp.expand();
  const bg = "#0b0d12";
  webApp.setHeaderColor(bg);
  webApp.setBackgroundColor(bg);
}

export function setBackButton(visible: boolean, onClick: () => void): () => void {
  const bb = isTelegram ? webApp?.BackButton : undefined;
  if (!bb) return () => {};
  if (visible) { bb.onClick(onClick); bb.show(); } else bb.hide();
  return () => { bb.offClick(onClick); bb.hide(); };
}

export function haptic(): void {
  if (!isTelegram) return;
  try { webApp?.HapticFeedback?.impactOccurred("light"); } catch { /* older clients */ }
}

export const cloudStorage: CloudStorageApi | undefined = isTelegram ? webApp?.CloudStorage : undefined;
