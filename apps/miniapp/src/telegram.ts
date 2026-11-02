/** The only file that touches window.Telegram.WebApp. Everything else uses this adapter. */

import type { CloudStorageApi } from "./storage";

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
  showConfirm?(message: string, cb: (ok: boolean) => void): void;
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

/** Native confirm dialog inside Telegram, window.confirm in a plain browser. */
export function confirmDialog(message: string): Promise<boolean> {
  if (isTelegram && webApp?.showConfirm) {
    return new Promise((res) => {
      try { webApp.showConfirm!(message, res); } catch { res(window.confirm(message)); }
    });
  }
  return Promise.resolve(window.confirm(message));
}

export const cloudStorage: CloudStorageApi | undefined = isTelegram ? webApp?.CloudStorage : undefined;
