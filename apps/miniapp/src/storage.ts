/** Key/value transport for saves: Telegram CloudStorage or localStorage.
 *  The codec (compact docs, chunks, versions) lives in @belvedere/engine/storage. */
import {
  chunkCount, fromChunks, parseProfile, parseRun, serializeProfile, serializeRun, toChunks,
  type GameState, type Profile,
} from "@belvedere/engine";
import { cloudStorage } from "./telegram";

export interface KV {
  get(keys: string[]): Promise<Record<string, string>>;
  set(key: string, value: string): Promise<void>;
  remove(keys: string[]): Promise<void>;
  keys(): Promise<string[]>;
}

const PREFIX = "blv_";

const localKV: KV = {
  async get(keys) {
    const out: Record<string, string> = {};
    for (const k of keys) { const v = localStorage.getItem(PREFIX + k); if (v !== null) out[k] = v; }
    return out;
  },
  async set(key, value) { localStorage.setItem(PREFIX + key, value); },
  async remove(keys) { for (const k of keys) localStorage.removeItem(PREFIX + k); },
  async keys() {
    const out: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
    }
    return out;
  },
};

function cloudKV(api: NonNullable<typeof cloudStorage>): KV {
  return {
    get: (keys) => new Promise((res, rej) => keys.length === 0 ? res({}) : api.getItems(keys, (e, v) => (e ? rej(new Error(e)) : res(v ?? {})))),
    set: (k, v) => new Promise((res, rej) => api.setItem(k, v, (e) => (e ? rej(new Error(e)) : res()))),
    remove: (keys) => new Promise((res, rej) => keys.length === 0 ? res() : api.removeItems(keys, (e) => (e ? rej(new Error(e)) : res()))),
    keys: () => new Promise((res, rej) => api.getKeys((e, k) => (e ? rej(new Error(e)) : res(k ?? [])))),
  };
}

export const kv: KV = cloudStorage ? cloudKV(cloudStorage) : localKV;

/** Writes a document as `<prefix>_<i>` chunks and removes stale chunks from a longer previous save. */
export async function saveDoc(store: KV, prefix: string, doc: string): Promise<void> {
  const chunks = toChunks(doc);
  for (let i = 0; i < chunks.length; i++) await store.set(`${prefix}_${i}`, chunks[i]!);
  const stale = (await store.keys()).filter((k) => {
    const m = new RegExp(`^${prefix}_(\\d+)$`).exec(k);
    return m && Number(m[1]) >= chunks.length;
  });
  await store.remove(stale);
}

export async function loadDoc(store: KV, prefix: string): Promise<string | null> {
  const first = (await store.get([`${prefix}_0`]))[`${prefix}_0`];
  if (first === undefined) return null;
  const n = chunkCount(first);
  const rest = await store.get(Array.from({ length: n - 1 }, (_, i) => `${prefix}_${i + 1}`));
  return fromChunks([first, ...Array.from({ length: n - 1 }, (_, i) => rest[`${prefix}_${i + 1}`] ?? "")]);
}

export async function removeDoc(store: KV, prefix: string): Promise<void> {
  const keys = (await store.keys()).filter((k) => k.startsWith(`${prefix}_`));
  await store.remove(keys);
}

const PROFILE = "profile";
const RUN = "run";

export const saveProfile = (p: Profile) => saveDoc(kv, PROFILE, serializeProfile(p));
export const saveRun = (s: GameState) => saveDoc(kv, RUN, serializeRun(s));
export const clearRun = () => removeDoc(kv, RUN);

export async function loadProfile(): Promise<Profile | null> {
  const doc = await loadDoc(kv, PROFILE);
  return doc === null ? null : parseProfile(doc);
}

export async function loadRun(profile: Profile): Promise<GameState | null> {
  const doc = await loadDoc(kv, RUN);
  return doc === null ? null : parseRun(doc, profile);
}
