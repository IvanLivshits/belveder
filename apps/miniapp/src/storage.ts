/** Save transport: a local store written first, synchronously from the caller's
 *  point of view, and an optional cloud store written asynchronously behind it.
 *  Cloud failures are swallowed. Every document carries a monotonic `rev`; on
 *  load the copy with the higher rev wins (cloud on a tie) and the loser is
 *  brought up to date, so an interrupted cloud write never resurrects old state.
 *  The codec (compact docs, chunks, versions) lives in @belvedere/engine/storage. */
import {
  chunkCount, fromChunks, parseProfile, parseRun, serializeProfile, serializeRun, toChunks,
  type GameState, type Profile,
} from "@belvedere/engine";

export interface KV {
  get(keys: string[]): Promise<Record<string, string>>;
  set(key: string, value: string): Promise<void>;
  remove(keys: string[]): Promise<void>;
  keys(): Promise<string[]>;
}

/** Minimal subset of the DOM Storage interface, so tests can pass a Map-backed fake. */
export interface StorageLike {
  length: number;
  key(i: number): string | null;
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export function localKV(storage: StorageLike, prefix = "blv_"): KV {
  return {
    async get(keys) {
      const out: Record<string, string> = {};
      for (const k of keys) { const v = storage.getItem(prefix + k); if (v !== null) out[k] = v; }
      return out;
    },
    async set(key, value) { storage.setItem(prefix + key, value); },
    async remove(keys) { for (const k of keys) storage.removeItem(prefix + k); },
    async keys() {
      const out: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k?.startsWith(prefix)) out.push(k.slice(prefix.length));
      }
      return out;
    },
  };
}

/** Telegram CloudStorage callback API, promisified. */
export interface CloudStorageApi {
  setItem(key: string, value: string, cb?: (err: string | null, ok?: boolean) => void): void;
  getItems(keys: string[], cb: (err: string | null, values?: Record<string, string>) => void): void;
  removeItems(keys: string[], cb?: (err: string | null, ok?: boolean) => void): void;
  getKeys(cb: (err: string | null, keys?: string[]) => void): void;
}

export function cloudKV(api: CloudStorageApi): KV {
  return {
    get: (keys) => new Promise((res, rej) => keys.length === 0 ? res({}) : api.getItems(keys, (e, v) => (e ? rej(new Error(e)) : res(v ?? {})))),
    set: (k, v) => new Promise((res, rej) => api.setItem(k, v, (e) => (e ? rej(new Error(e)) : res()))),
    remove: (keys) => new Promise((res, rej) => keys.length === 0 ? res() : api.removeItems(keys, (e) => (e ? rej(new Error(e)) : res()))),
    keys: () => new Promise((res, rej) => api.getKeys((e, k) => (e ? rej(new Error(e)) : res(k ?? [])))),
  };
}

// ---- documents as chunked keys ----

/** Writes `<prefix>_<i>` chunks and removes stale chunks left by a longer previous save. */
export async function saveDoc(store: KV, prefix: string, doc: string): Promise<void> {
  const chunks = toChunks(doc);
  for (let i = 0; i < chunks.length; i++) await store.set(`${prefix}_${i}`, chunks[i]!);
  await removeDoc(store, prefix, chunks.length);
}

export async function loadDoc(store: KV, prefix: string): Promise<string | null> {
  const first = (await store.get([`${prefix}_0`]))[`${prefix}_0`];
  if (first === undefined) return null;
  const n = chunkCount(first);
  const names = Array.from({ length: n - 1 }, (_, i) => `${prefix}_${i + 1}`);
  const rest = await store.get(names);
  return fromChunks([first, ...names.map((k) => rest[k] ?? "")]);
}

/** Removes chunks with index >= from (all of them by default). */
export async function removeDoc(store: KV, prefix: string, from = 0): Promise<void> {
  const re = new RegExp(`^${prefix}_(\\d+)$`);
  const stale = (await store.keys()).filter((k) => { const m = re.exec(k); return m !== null && Number(m[1]) >= from; });
  await store.remove(stale);
}

// ---- envelope: rev + savedAt around the codec document ----

export interface Envelope {
  rev: number;
  savedAt: number;
  /** Codec document; empty string is a tombstone (document deleted). */
  body: string;
}

const ENVELOPE_RE = /^rev=(\d+);at=(\d+)\|/;

export function encodeEnvelope(e: Envelope): string {
  return `rev=${e.rev};at=${e.savedAt}|${e.body}`;
}

/** Documents written before envelopes existed decode as rev 0. */
export function decodeEnvelope(doc: string): Envelope {
  const m = ENVELOPE_RE.exec(doc);
  if (!m) return { rev: 0, savedAt: 0, body: doc };
  return { rev: Number(m[1]), savedAt: Number(m[2]), body: doc.slice(m[0].length) };
}

// ---- write queue: latest doc per prefix wins, one write in flight ----

function makeQueue(store: KV) {
  const latest = new Map<string, string>();
  const inflight = new Map<string, Promise<void>>();
  const drain = async (prefix: string): Promise<void> => {
    for (;;) {
      const next = latest.get(prefix);
      if (next === undefined) return;
      latest.delete(prefix);
      try {
        await saveDoc(store, prefix, next);
      } catch {
        // Swallowed on purpose: the local copy is the fallback. Stop draining to avoid hammering the store.
        latest.delete(prefix);
        return;
      }
    }
  };
  return {
    push(prefix: string, doc: string): Promise<void> {
      latest.set(prefix, doc);
      if (!inflight.has(prefix)) {
        const p = drain(prefix).finally(() => inflight.delete(prefix));
        inflight.set(prefix, p);
      }
      return inflight.get(prefix)!;
    },
    idle: () => Promise.all(inflight.values()).then(() => undefined),
  };
}

// ---- app-level document: what the UI already showed (hints, notebook pages) ----

export interface UiMeta {
  hintsShown: string[];
  pagesRead: string[];
  /** Bumped by a progress reset: a copy with a higher epoch replaces, not merges, an older one.
   *  That is the one way a grow-only set can shrink across devices. */
  epoch: number;
}

const UI_VERSION = 1;
const UI_ID_RE = /^[a-z][a-z0-9_.]*$/;

export function serializeUi(ui: UiMeta): string {
  return `u${UI_VERSION};e=${ui.epoch};h=${ui.hintsShown.join(",")};p=${ui.pagesRead.join(",")}`;
}

/** Grow-only sets: the union keeps every device's reads (G-Set); order is first-seen. */
export function unionUi(a: UiMeta, b: UiMeta): UiMeta {
  if (a.epoch !== b.epoch) return a.epoch > b.epoch ? { ...a } : { ...b };
  const u = (x: string[], y: string[]) => [...new Set([...x, ...y])];
  return { epoch: a.epoch, hintsShown: u(a.hintsShown, b.hintsShown), pagesRead: u(a.pagesRead, b.pagesRead) };
}

function sameUi(a: UiMeta, b: UiMeta): boolean {
  const same = (x: string[], y: string[]) => x.length === y.length && x.every((id) => y.includes(id));
  return a.epoch === b.epoch && same(a.hintsShown, b.hintsShown) && same(a.pagesRead, b.pagesRead);
}

export const EMPTY_UI: UiMeta = { hintsShown: [], pagesRead: [], epoch: 0 };

/** Unknown version or garbage decodes as empty: the worst case is a hint shown twice. */
export function parseUi(doc: string): UiMeta {
  const [ver, ...fields] = doc.split(";");
  if (ver !== `u${UI_VERSION}`) return EMPTY_UI;
  const field = (key: string) => fields.find((f) => f.startsWith(`${key}=`))?.slice(2) ?? "";
  const list = (key: string) => field(key).split(",").filter((id) => UI_ID_RE.test(id));
  const epoch = Number(field("e"));
  return { hintsShown: list("h"), pagesRead: list("p"), epoch: Number.isInteger(epoch) && epoch >= 0 ? epoch : 0 };
}

// ---- public API ----

export interface Saves {
  /** Fire-and-forget: local store immediately, cloud behind it. Never throws. */
  persistProfile(p: Profile): void;
  persistRun(s: GameState): void;
  /** Writes a tombstone (rev+1, empty body) so a stale cloud run cannot come back. */
  clearRun(): void;
  loadProfile(): Promise<Profile | null>;
  loadRun(profile: Profile): Promise<GameState | null>;
  persistUi(ui: UiMeta): void;
  loadUi(): Promise<UiMeta>;
  /** Wipes progress on every device: tombstones for profile and run, a fresh ui doc with a higher epoch.
   *  Returns the ui meta to continue with. */
  resetAll(): UiMeta;
  /** Resolves when queued writes have settled (tests, page hide). */
  flush(): Promise<void>;
}

const PROFILE = "profile";
const RUN = "run";
const UI = "ui";

type Read = { ok: true; env: Envelope | null } | { ok: false };

async function readEnvelope(store: KV, prefix: string): Promise<Read> {
  try {
    const doc = await loadDoc(store, prefix);
    return { ok: true, env: doc === null ? null : decodeEnvelope(doc) };
  } catch {
    return { ok: false };
  }
}

export function createSaves(local: KV, cloud?: KV, now: () => number = () => Date.now()): Saves {
  const localQ = makeQueue(local);
  const cloudQ = cloud ? makeQueue(cloud) : undefined;
  /** Last known rev per document, seeded by load(). */
  const revs = new Map<string, number>();

  const write = (prefix: string, body: string) => {
    const rev = (revs.get(prefix) ?? 0) + 1;
    revs.set(prefix, rev);
    const doc = encodeEnvelope({ rev, savedAt: now(), body });
    void localQ.push(prefix, doc);
    void cloudQ?.push(prefix, doc);
  };

  /** Picks the copy with the higher rev (cloud on a tie), syncs the loser, returns the body or null. */
  const read = async (prefix: string): Promise<string | null> => {
    const [l, c] = await Promise.all([readEnvelope(local, prefix), cloud ? readEnvelope(cloud, prefix) : Promise.resolve<Read>({ ok: true, env: null })]);
    const le = l.ok ? l.env : null;
    const ce = c.ok ? c.env : null;
    let winner: Envelope | null;
    if (le && ce) winner = le.rev > ce.rev ? le : ce;
    else winner = le ?? ce;
    if (!winner) return null;
    revs.set(prefix, Math.max(winner.rev, revs.get(prefix) ?? 0));
    const doc = encodeEnvelope(winner);
    // Bring the losing side up to date; only when that side was readable, so a blind write
    // never clobbers a copy we could not inspect.
    if (cloudQ && c.ok && winner !== ce) void cloudQ.push(prefix, doc);
    if (l.ok && winner !== le) void localQ.push(prefix, doc);
    return winner.body === "" ? null : winner.body;
  };

  /** The ui document holds grow-only sets, so the two copies are merged, not ranked: picking the
   *  higher rev would drop pages read on the other device. When both sides were readable and
   *  differ, the union (rev = max + 1) goes back to every side that lacks something. */
  let uiEpoch = 0;
  const readUi = async (): Promise<UiMeta> => {
    const [l, c] = await Promise.all([readEnvelope(local, UI), cloud ? readEnvelope(cloud, UI) : Promise.resolve<Read>({ ok: true, env: null })]);
    const meta = (r: Read) => (r.ok && r.env && r.env.body !== "" ? parseUi(r.env.body) : EMPTY_UI);
    const lm = meta(l), cm = meta(c);
    const merged = unionUi(lm, cm);
    revs.set(UI, Math.max(revs.get(UI) ?? 0, l.ok ? l.env?.rev ?? 0 : 0, c.ok ? c.env?.rev ?? 0 : 0));
    if (l.ok && c.ok && !sameUi(lm, cm)) {
      const rev = (revs.get(UI) ?? 0) + 1;
      revs.set(UI, rev);
      const doc = encodeEnvelope({ rev, savedAt: now(), body: serializeUi(merged) });
      if (!sameUi(lm, merged)) void localQ.push(UI, doc);
      if (!sameUi(cm, merged)) void cloudQ?.push(UI, doc);
    }
    uiEpoch = merged.epoch;
    return merged;
  };

  return {
    persistProfile: (p) => write(PROFILE, serializeProfile(p)),
    persistRun: (s) => write(RUN, serializeRun(s)),
    clearRun: () => write(RUN, ""),
    loadProfile: async () => { const d = await read(PROFILE); return d === null ? null : parseProfile(d); },
    loadRun: async (profile) => { const d = await read(RUN); return d === null ? null : parseRun(d, profile); },
    persistUi: (ui) => { uiEpoch = Math.max(uiEpoch, ui.epoch); write(UI, serializeUi(ui)); },
    resetAll: () => {
      write(PROFILE, "");
      write(RUN, "");
      const fresh: UiMeta = { ...EMPTY_UI, epoch: uiEpoch + 1 };
      uiEpoch = fresh.epoch;
      write(UI, serializeUi(fresh));
      return fresh;
    },
    loadUi: readUi,
    flush: () => Promise.all([localQ.idle(), cloudQ?.idle()]).then(() => undefined),
  };
}
