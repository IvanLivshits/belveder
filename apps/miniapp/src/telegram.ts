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
  SettingsButton?: BackButtonApi;
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

/** Telegram's gear in the Mini App header; the same show/hide/onClick shape as BackButton. */
export function setSettingsButton(visible: boolean, onClick: () => void): () => void {
  const sb = isTelegram ? webApp?.SettingsButton : undefined;
  if (!sb) return () => {};
  if (visible) { sb.onClick(onClick); sb.show(); } else sb.hide();
  return () => { sb.offClick(onClick); sb.hide(); };
}

/**
 * Calls `cb` whenever the app becomes visible or hidden to the player. In Telegram that is the client's
 * activated/deactivated events (a minimised Mini App stays "visible" to the page, so visibilitychange alone
 * misses it); the page's own visibilitychange covers tab switches and a plain browser.
 */
export function onActiveChange(cb: (active: boolean) => void): void {
  let clientActive = true;
  const emit = () => cb(clientActive && !document.hidden);
  document.addEventListener("visibilitychange", emit);
  if (isTelegram && webApp) {
    try {
      webApp.onEvent("activated", () => { clientActive = true; emit(); });
      webApp.onEvent("deactivated", () => { clientActive = false; emit(); });
    } catch { /* clients older than Bot API 8.0 have no such events: visibilitychange only */ }
  }
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
