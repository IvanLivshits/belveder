/** The only file that touches FMOD. Sound is optional: if anything fails, the game stays silent. */

import type createFMOD from "./fmod/fmodstudio";
import type { FMOD } from "./fmod/fmodstudio";
import { onActiveChange } from "./telegram";
import bankMaster from "./banks/Master.bank?url";
import bankStrings from "./banks/Master.strings.bank?url";
import wasmUrl from "./fmod/fmodstudio.wasm?url";

/** Banks built in FMOD Studio for the HTML5 platform (src/banks/). Vite puts a hash in their names, so a rebuilt
 *  bank is never served stale from the Telegram cache. The strings bank comes first: event paths need it. */
const BANKS = [bankStrings, bankMaster];
const EVENT_MUSIC = "event:/music";
const EVENT_RAIN = "event:/rain";
const EVENT_LIGHTER = "event:/lighter";
/** Discrete parameter of the music event: 0 Rainy, 1 Tension. FMOD itself blends between them. */
const PARAM_TENSION = "MusicState";
const STORAGE_KEY = "belvedere.sound";
const UPDATE_MS = 50;

interface Engine {
  core: FMOD.Core.System;
  system: FMOD.Studio.System;
  lighter: FMOD.Studio.EventDescription;
  music: FMOD.Studio.EventInstance;
  rain: FMOD.Studio.EventInstance;
}

let engine: Engine | null = null;
let loading = false;
/** Browsers play sound only after a tap; set by the first one. */
let gestured = false;
let enabled = readEnabled();
/** The app is on screen: visible page and, in Telegram, not minimised (see onActiveChange). */
let active = !document.hidden;
let tense = false;
/** The events have been started at least once. */
let began = false;
/** The mixer runs and `system.update()` is ticking. */
let running = false;
let timer: ReturnType<typeof setInterval> | undefined;

function readEnabled(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== "off"; } catch { return true; }
}

/**
 * Starts or suspends the mixer to match: ready, tapped at least once, not muted, app visible.
 * The very first start must happen inside a tap handler (`inGesture`): if the engine finishes
 * loading after the tap, starting here would leave the audio context locked (iOS) while `running` is already true.
 */
function apply(inGesture = false): void {
  const e = engine;
  if (!e) return;
  const shouldRun = gestured && enabled && active && (began || inGesture);
  try {
    if (shouldRun && !running) {
      if (!began) {
        // FMOD's own recipe for the first user gesture: bounce the mixer so the audio context really resumes.
        e.core.mixerSuspend();
        e.core.mixerResume();
        e.music.start();
        e.rain.start();
        began = true;
      } else {
        e.core.mixerResume();
      }
      timer = setInterval(() => e.system.update(), UPDATE_MS);
      running = true;
    } else if (!shouldRun && running) {
      e.core.mixerSuspend();
      clearInterval(timer);
      running = false;
    }
  } catch (err) {
    console.warn("audio: disabled", err);
    clearInterval(timer);
    engine = null;
    running = false;
  }
}

async function load(): Promise<void> {
  // A lazy chunk: the runtime and its 3 MB wasm stay off the first screen.
  const { default: create } = await import("./fmod/fmodstudio.js");
  const options: Parameters<typeof createFMOD>[0] & { locateFile(path: string): string } = { locateFile: () => wasmUrl };
  const fmod = await create(options);
  const system = fmod.Studio_System_Create();
  system.initialize(32, fmod.STUDIO_INIT_NORMAL, fmod.INIT_NORMAL);
  for (const url of BANKS) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const bytes = await res.arrayBuffer();
    system.loadBankMemory(bytes, bytes.byteLength, fmod.STUDIO_LOAD_MEMORY, fmod.STUDIO_LOAD_BANK_NORMAL);
  }
  const lighter = system.getEvent(EVENT_LIGHTER);
  lighter.loadSampleData(); // so the first flick has no delay
  const music = system.getEvent(EVENT_MUSIC).createInstance();
  music.setParameterByName(PARAM_TENSION, tense ? 1 : 0, true);
  const rain = system.getEvent(EVENT_RAIN).createInstance();
  system.flushSampleLoading();
  engine = { core: system.getCoreSystem(), system, lighter, music, rain };
  apply();
}

/** Call once at startup, after the content is ready. Loads FMOD in the background and arms the first-tap unlock. */
export function initAudio(): void {
  if (loading) return;
  loading = true;
  const unlock = () => {
    gestured = true;
    apply(true);
    // Keep listening until the engine has really started inside a tap; it may still be loading on the first one.
    if (began) {
      window.removeEventListener("click", unlock, true);
      window.removeEventListener("touchend", unlock, true);
    }
  };
  // Capture phase: runs before the button's own handler, so a first tap on "Начать" already has sound.
  window.addEventListener("click", unlock, true);
  window.addEventListener("touchend", unlock, true);
  onActiveChange((on) => { active = on; apply(); });
  load().catch((err) => console.warn("audio: disabled", err));
}

/** Lighter flick; skipped while muted, hidden or not loaded yet (a late flick would be worse than none). */
export function playLighter(): void {
  if (!engine || !running) return;
  try {
    const flick = engine.lighter.createInstance();
    flick.start();
    flick.release(); // frees itself when it finishes
  } catch (err) {
    console.warn("audio: lighter", err);
  }
}

/** Switches the music between the rainy-night and the tension layer. Safe to call every render. */
export function setTension(on: boolean): void {
  if (on === tense) return;
  tense = on;
  try { engine?.music.setParameterByName(PARAM_TENSION, on ? 1 : 0); } catch (err) { console.warn("audio: tension", err); }
}

export function isSoundOn(): boolean {
  return enabled;
}

/** Per device on purpose: lives in localStorage, not in the synced save. */
export function setSoundOn(on: boolean): void {
  enabled = on;
  try { localStorage.setItem(STORAGE_KEY, on ? "on" : "off"); } catch { /* private mode: lasts until reload */ }
  apply();
}
