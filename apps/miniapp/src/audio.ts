/** The only file that touches FMOD. Sound is optional: if anything fails, the game stays silent. */

import type createFMOD from "./fmod/fmodstudio";
import type { FMOD } from "./fmod/fmodstudio";
import { onActiveChange } from "./telegram";
import bankMaster from "./banks/Master.bank?url";
import bankStrings from "./banks/Master.strings.bank?url";
import wasmUrl from "./fmod/fmodstudio.wasm?url";

/** Banks built in FMOD Studio for the HTML5 platform (src/banks/) and the runtime's wasm. Vite puts a hash in their
 *  names, so a rebuilt file is never served stale. The strings bank comes first: event paths need it. */
const FILES = [bankStrings, bankMaster, wasmUrl] as const;
/** Cache API store for FILES: it outlives the WebView's HTTP cache (which drops a 7 MB file first) and does not depend
 *  on the hosting's Cache-Control. Bump the name if the layout of the store ever changes. */
const CACHE = "belvedere-audio-v1";
/** How long the download may wait for an idle moment after the title is on screen (Safari has no requestIdleCallback). */
const IDLE_TIMEOUT_MS = 1500;
const IDLE_FALLBACK_MS = 800;
const EVENT_MUSIC = "event:/music";
const EVENT_RAIN = "event:/rain";
const EVENT_LIGHTER = "event:/lighter";
/** Discrete parameter of the music event: 0 the calmest (morning, no suspicion), 1 to 3 rising tension. FMOD itself blends between them. */
const PARAM_TENSION = "MusicState";
/** One-shot sounds that the content or the screens ask for by name (`cue: record` on a choice, the pencil on the
 *  morning page). `pausesMusic`: the music stands still while it plays and resumes at the current tension afterwards.
 *  A name or an event that is missing from the banks is silent. */
const CUES: Readonly<Record<string, { event: string; pausesMusic: boolean }>> = {
  record: { event: "event:/record", pausesMusic: true },
  pencil_crossing_out: { event: "event:/pencil_crossing_out", pausesMusic: false },
  pencil_writing: { event: "event:/pencil_writing", pausesMusic: false },
};
const STORAGE_KEY = "belvedere.sound";
const UPDATE_MS = 50;

interface Engine {
  core: FMOD.Core.System;
  system: FMOD.Studio.System;
  lighter: FMOD.Studio.EventDescription;
  music: FMOD.Studio.EventInstance;
  rain: FMOD.Studio.EventInstance;
  cues: Map<string, { desc: FMOD.Studio.EventDescription; pausesMusic: boolean }>;
  /** FMOD's constants, kept here because only `load()` holds the runtime object. */
  stopped: number;
  immediate: number;
}

let engine: Engine | null = null;
/** Loading is in progress or done: never start it twice. */
let loading = false;
/** Loading or the mixer failed: no automatic retry (idle, tap); only the sound switch tries again. */
let failed = false;
/** Browsers play sound only after a tap; set by the first one. */
let gestured = false;
let enabled = readEnabled();
/** The app is on screen: visible page and, in Telegram, not minimised (see onActiveChange). */
let active = !document.hidden;
/** The tension level FMOD has now (the blending between levels is FMOD's job). */
let tension = 0;
/** The one-shot sound that is playing now (the music is paused meanwhile). */
/** `seen`: FMOD has reported it as not stopped at least once; until then "stopped" only means it has not started yet. */
const playing = new Map<string, { instance: FMOD.Studio.EventInstance; pausesMusic: boolean; seen: boolean; at: number }>();
/** How long a freshly started sound may report "stopped" before we believe it (a sound that failed to start). */
const START_GRACE_MS = 1500;
/** The events have been started at least once. */
let began = false;
/** The mixer runs and `system.update()` is ticking. */
let running = false;
let timer: ReturnType<typeof setInterval> | undefined;
let armed = false;

function readEnabled(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== "off"; } catch { return true; }
}

/** Frees the FMOD system (and with it the audio context) and stops listening. After this the game stays silent. */
function teardown(e: Engine | null): void {
  clearInterval(timer);
  running = false;
  began = false;
  playing.clear();
  loading = false;
  failed = true;
  disarm();
  if (engine === e) engine = null;
  try { e?.system.release(); } catch (err) { console.warn("audio: release", err); }
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
      timer = setInterval(tick, UPDATE_MS);
      running = true;
    } else if (!shouldRun && running) {
      e.core.mixerSuspend();
      clearInterval(timer);
      running = false;
    }
  } catch (err) {
    console.warn("audio: disabled", err);
    teardown(e);
  }
}

/** One FMOD frame. A failure here would repeat 20 times a second, so it shuts the sound down instead. */
function tick(): void {
  const e = engine;
  if (!e) { clearInterval(timer); return; }
  try {
    e.system.update();
    for (const [id, c] of playing) {
      if (c.instance.getPlaybackState() !== e.stopped) c.seen = true;
      else if (c.seen || performance.now() - c.at > START_GRACE_MS) endCue(e, id, false);
    }
    // The music is paused exactly while a sound that pauses it plays; this also repairs any drift.
    const wantPaused = [...playing.values()].some((p) => p.pausesMusic);
    if (e.music.getPaused() !== wantPaused) e.music.setPaused(wantPaused);
  } catch (err) {
    console.warn("audio: update failed, disabled", err);
    teardown(e);
  }
}

/** The one-shot sound `id` is over (or cut): free it and, when no other sound that pauses the music is left, let the
 *  music go on. */
function endCue(e: Engine, id: string, cut: boolean): void {
  const c = playing.get(id);
  if (!c) return;
  playing.delete(id);
  try {
    if (cut) c.instance.stop(e.immediate);
    c.instance.release();
  } catch (err) { console.warn("audio: cue", err); }
  if (c.pausesMusic && ![...playing.values()].some((p) => p.pausesMusic)) {
    try { e.music.setPaused(false); } catch (err) { console.warn("audio: music resume", err); }
  }
}

const absolute = (url: string) => new URL(url, location.href).href;

/** Reads one of FILES through the Cache API; a miss goes to the network at low priority (the pictures of the
 *  first screens matter more) and is stored for the next cold start. Without the Cache API it is a plain fetch. */
async function fetchBytes(url: string): Promise<ArrayBuffer> {
  let cache: Cache | undefined;
  try {
    cache = await caches.open(CACHE);
    const hit = await cache.match(url);
    if (hit) return hit.arrayBuffer();
  } catch { /* no Cache API here (private mode, old WebView): the network every time */ }
  const res = await fetch(url, { priority: "low" } as RequestInit);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  if (cache) {
    try { await cache.put(url, res.clone()); } catch { /* quota: next time from the network again */ }
  }
  return res.arrayBuffer();
}

/** Drops files of earlier builds (other hashes) from the store, so it holds one set of banks, not every one ever shipped. */
async function pruneCache(): Promise<void> {
  try {
    const cache = await caches.open(CACHE);
    const keep = new Set(FILES.map(absolute));
    for (const req of await cache.keys()) if (!keep.has(req.url)) await cache.delete(req);
  } catch { /* nothing to prune */ }
}

type FmodOptions = Parameters<typeof createFMOD>[0] & { locateFile(path: string): string; wasmBinary: ArrayBuffer };

async function load(): Promise<void> {
  // Everything downloads at once: both banks, the wasm and the runtime's js chunk (lazy, so none of this is on the
  // first screen). Only loading into FMOD keeps an order. The wasm is fetched here and handed over as `wasmBinary`,
  // so the runtime does not start its own download after its js has arrived, and the file goes through the cache too.
  const files = Promise.all([fetchBytes(bankStrings), fetchBytes(bankMaster), fetchBytes(wasmUrl)]);
  files.catch(() => {}); // reported below when awaited; this only stops an unhandled rejection if we fail earlier
  const { default: create } = await import("./fmod/fmodstudio.js");
  const [strings, master, wasm] = await files;
  const options: FmodOptions = { locateFile: () => wasmUrl, wasmBinary: wasm };
  const fmod = await create(options);
  const system = fmod.Studio_System_Create();
  try {
    system.initialize(32, fmod.STUDIO_INIT_NORMAL, fmod.INIT_NORMAL);
    for (const bytes of [strings, master]) {
      system.loadBankMemory(bytes, bytes.byteLength, fmod.STUDIO_LOAD_MEMORY, fmod.STUDIO_LOAD_BANK_NORMAL);
    }
    const lighter = system.getEvent(EVENT_LIGHTER);
    lighter.loadSampleData(); // so the first flick has no delay
    const music = system.getEvent(EVENT_MUSIC).createInstance();
    music.setParameterByName(PARAM_TENSION, tension, true);
    const rain = system.getEvent(EVENT_RAIN).createInstance();
    const cues = new Map<string, { desc: FMOD.Studio.EventDescription; pausesMusic: boolean }>();
    for (const [id, { event, pausesMusic }] of Object.entries(CUES)) {
      // A cue missing from the banks must not take the music down with it.
      try { const desc = system.getEvent(event); desc.loadSampleData(); cues.set(id, { desc, pausesMusic }); } catch (err) { console.warn(`audio: cue ${id} is not in the banks`, err); }
    }
    system.flushSampleLoading();
    engine = { core: system.getCoreSystem(), system, lighter, music, rain, cues, stopped: fmod.STUDIO_PLAYBACK_STOPPED, immediate: fmod.STUDIO_STOP_IMMEDIATE };
  } catch (err) {
    try { system.release(); } catch { /* already broken */ }
    throw err;
  }
  void pruneCache();
  apply();
}

/** Downloads and starts FMOD once, and only if sound is on: a muted player never pays for the ~10 MB. */
function startLoading(): void {
  if (loading || failed || !enabled) return;
  loading = true;
  load().catch((err) => {
    console.warn("audio: disabled", err);
    loading = false;
    failed = true;
    disarm();
  });
}

/** First-tap unlock. A tap also starts the download if the idle moment has not come yet: the player is here to stay.
 *  Stays armed until the engine has really started inside a tap (it may still be loading on the first one). */
function unlock(): void {
  gestured = true;
  startLoading();
  apply(true);
  if (began) disarm();
}

/** Runs `cb` when the browser is idle after the current frame; Safari has no requestIdleCallback, so a short timer stands in. */
function whenIdle(cb: () => void): void {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => cb(), { timeout: IDLE_TIMEOUT_MS });
  else setTimeout(cb, IDLE_FALLBACK_MS);
}

function arm(): void {
  if (armed) return;
  armed = true;
  // Capture phase: runs before the button's own handler, so a first tap on "Начать" already has sound.
  window.addEventListener("click", unlock, true);
  window.addEventListener("touchend", unlock, true);
}

function disarm(): void {
  armed = false;
  window.removeEventListener("click", unlock, true);
  window.removeEventListener("touchend", unlock, true);
}

/** Call once at startup, when the title is about to appear. Arms the first-tap unlock; if sound is on, the ~10 MB
 *  download starts at the first idle moment after the title has painted (or at the first tap), so the cover and the
 *  first portraits get the network to themselves. */
export function initAudio(): void {
  if (armed || loading) return;
  arm();
  onActiveChange((on) => { active = on; apply(); });
  if (enabled) whenIdle(startLoading);
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

/** Sets the music's tension level (0 is the rainy night, see `tensionLevel` in the engine). Safe to call every render. */
export function setTension(level: number): void {
  if (level === tension) return;
  if (!engine) { tension = level; return; } // nothing plays yet: load() starts at this level
  try {
    engine.music.setParameterByName(PARAM_TENSION, level);
    tension = level; // only after FMOD took it, so a failed call is retried on the next render
  } catch (err) {
    console.warn("audio: tension", err);
  }
}

/** Plays a one-shot sound by its name; if it pauses the music, the music waits until the sound ends. Sounds are
 *  independent: the pencil can play over the record. Skipped while muted, hidden, not loaded yet, unknown, or while
 *  the same sound is still playing. */
export function playCue(id: string): void {
  const e = engine;
  const entry = e?.cues.get(id);
  if (!e || !entry || !running || playing.has(id)) return;
  try {
    const instance = entry.desc.createInstance();
    if (entry.pausesMusic) e.music.setPaused(true);
    playing.set(id, { instance, pausesMusic: entry.pausesMusic, seen: false, at: performance.now() });
    instance.start();
  } catch (err) {
    console.warn("audio: cue", id, err);
    if (playing.has(id)) endCue(e, id, true);
    else if (entry.pausesMusic && ![...playing.values()].some((p) => p.pausesMusic)) {
      try { e.music.setPaused(false); } catch { /* the music is gone with the engine */ }
    }
  }
}

/** Cuts the one-shot sound `id` if it plays (the others are left alone), and brings the music back when it was the
 *  last one that had paused it. */
export function stopCue(id: string): void {
  if (engine) endCue(engine, id, true);
}

export function isSoundOn(): boolean {
  return enabled;
}

/** Per device on purpose: lives in localStorage, not in the synced save. Turning it on starts the download (or
 *  retries it after a failure). Called from the switch's tap handler, so the mixer may start right here. */
export function setSoundOn(on: boolean): void {
  enabled = on;
  try { localStorage.setItem(STORAGE_KEY, on ? "on" : "off"); } catch { /* private mode: lasts until reload */ }
  if (on) { failed = false; startLoading(); }
  apply(on);
}
