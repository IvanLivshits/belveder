/**
 * Compact, versioned serialization of profile and in-progress run for
 * key/value stores with small values (Telegram CloudStorage: 4096 chars/value).
 *
 * Wire format (one logical document = one string, split into chunks):
 *   `b<STORAGE_VERSION>;<field>=<value>;<field>=<value>...`
 * Qualities are written as `q.<id>=<int>`, only non-default ones.
 * Chunk 0 starts with the header `<version>:<chunkCount>|`.
 */
import { STATE_VERSION, emptyHistory, type GameState, type History, type NightRecord, type Profile, type Qualities } from "./state";

export const STORAGE_VERSION = 1;
/** Telegram CloudStorage value limit is 4096; keep headroom. */
export const CHUNK_SIZE = 4000;

const SEP = ";";

/** Bags only hold non-default values (setQuality drops defaults), so every key is written,
 *  including explicit zeros for qualities whose default is not 0. */
function encodeQualities(q: Qualities): string[] {
  return Object.keys(q).sort().map((k) => `q.${k}=${q[k]}`);
}

function decodeFields(body: string): Map<string, string> {
  const out = new Map<string, string>();
  if (body === "") return out;
  for (const part of body.split(SEP)) {
    const eq = part.indexOf("=");
    if (eq < 0) throw new Error(`bad field: ${part}`);
    out.set(part.slice(0, eq), part.slice(eq + 1));
  }
  return out;
}

function qualitiesFrom(fields: Map<string, string>): Qualities {
  const q: Qualities = {};
  for (const [k, v] of fields) {
    if (!k.startsWith("q.")) continue;
    const n = Number(v);
    if (!Number.isInteger(n)) throw new Error(`bad quality value: ${k}=${v}`);
    q[k.slice(2)] = n;
  }
  return q;
}

function encodeDoc(fields: string[]): string {
  return [`b${STORAGE_VERSION}`, ...fields].join(SEP);
}

function decodeDoc(doc: string): Map<string, string> {
  const nl = doc.indexOf(SEP);
  const head = nl < 0 ? doc : doc.slice(0, nl);
  if (head !== `b${STORAGE_VERSION}`) throw new Error(`unsupported storage version: ${head}`);
  return decodeFields(nl < 0 ? "" : doc.slice(nl + 1));
}

// ---- history (the final story's raw material) ----
// `h=` nights separated by `,`; one night is `<0|1>/<pair>/<slot:frag+…>/<quality:value+…>/<night number>`.
// `pl=` pawned pair ids in order. Both optional: docs from before the story decode as empty.

function encodeNight(n: NightRecord): string {
  const report = Object.keys(n.report).sort().map((s) => `${s}:${n.report[s]}`).join("+");
  const values = Object.keys(n.values).sort().map((q) => `${q}:${n.values[q]}`).join("+");
  return `${n.pledged ? 1 : 0}/${n.pair ?? ""}/${report}/${values}/${n.night}`;
}

function decodeNight(src: string, index: number): NightRecord {
  const [pledged, pair, report, values, night] = src.split("/");
  if (pledged === undefined || pair === undefined || report === undefined || values === undefined) throw new Error(`bad night record: ${src}`);
  const n = night === undefined || night === "" ? index + 1 : Number(night);
  if (!Number.isInteger(n)) throw new Error(`bad night number: ${night}`);
  const pairs = (list: string) => (list === "" ? [] : list.split("+")).map((kv) => { const i = kv.indexOf(":"); return [kv.slice(0, i), kv.slice(i + 1)] as const; });
  const rec: NightRecord = {
    night: n,
    pledged: pledged === "1",
    report: Object.fromEntries(pairs(report)),
    values: Object.fromEntries(pairs(values).map(([k, v]) => { const n = Number(v); if (!Number.isInteger(n)) throw new Error(`bad value: ${kv(k, v)}`); return [k, n]; })),
  };
  return pair === "" ? rec : { ...rec, pair };
}
const kv = (k: string, v: string) => `${k}:${v}`;

/** Empty fields are left out, so a profile without nights serializes exactly as before the story existed. */
function encodeHistory(h: History): string[] {
  const out: string[] = [];
  if (h.nights.length > 0) out.push(`h=${h.nights.map(encodeNight).join(",")}`);
  if (h.pledges.length > 0) out.push(`pl=${h.pledges.join(",")}`);
  return out;
}

function historyFrom(fields: Map<string, string>): History {
  const h = fields.get("h"), pl = fields.get("pl");
  return {
    nights: h === undefined || h === "" ? [] : h.split(",").map((src, i) => decodeNight(src, i)),
    pledges: pl === undefined || pl === "" ? [] : pl.split(","),
  };
}

// ---- profile ----

export function serializeProfile(profile: Profile): string {
  return encodeDoc([...encodeQualities(profile.profile), ...encodeHistory(profile.history ?? emptyHistory())]);
}

export function parseProfile(doc: string): Profile {
  const f = decodeDoc(doc);
  return { v: STATE_VERSION, profile: qualitiesFrom(f), history: historyFrom(f) };
}

// ---- in-progress run ----

export function serializeRun(state: GameState): string {
  const fields = [
    `seed=${state.seed}`,
    `rng=${state.rng}`,
    `phase=${state.phase}`,
    `loc=${state.location}`,
    `sl=${state.storyletId}`,
    `pc=${state.pendingChoice ?? ""}`,
    `end=${state.ending ?? ""}`,
    `log=${state.log.map((e) => `${e.storylet}:${e.pair !== undefined ? `p${e.pair}` : e.choice}`).join(",")}`,
    `rep=${Object.keys(state.report).sort().map((s) => `${s}:${state.report[s]}`).join(",")}`,
    ...encodeQualities(state.run),
  ];
  return encodeDoc(fields);
}

/** Restores a run; profile qualities come from the separately stored profile. */
export function parseRun(doc: string, profile: Profile): GameState {
  const f = decodeDoc(doc);
  const need = (k: string) => {
    const v = f.get(k);
    if (v === undefined) throw new Error(`missing field: ${k}`);
    return v;
  };
  const phase = need("phase");
  if (phase !== "scene" && phase !== "outcome" && phase !== "report" && phase !== "ending") throw new Error(`bad phase: ${phase}`);
  const log = need("log") === "" ? [] : need("log").split(",").map((e) => {
    const i = e.lastIndexOf(":");
    const tail = e.slice(i + 1);
    return tail.startsWith("p")
      ? { storylet: e.slice(0, i), choice: -1, pair: tail.slice(1) }
      : { storylet: e.slice(0, i), choice: Number(tail) };
  });
  const pc = need("pc");
  const report: Record<string, string> = {};
  for (const pair of need("rep") === "" ? [] : need("rep").split(",")) {
    const i = pair.indexOf(":");
    report[pair.slice(0, i)] = pair.slice(i + 1);
  }
  return {
    v: STATE_VERSION,
    seed: Number(need("seed")),
    rng: Number(need("rng")),
    phase,
    location: need("loc"),
    storyletId: need("sl"),
    pendingChoice: pc === "" ? null : Number(pc),
    run: qualitiesFrom(f),
    profile: { ...profile.profile },
    log,
    report,
    history: { nights: [...(profile.history?.nights ?? [])], pledges: [...(profile.history?.pledges ?? [])] },
    ending: f.get("end") ? f.get("end")! : null,
  };
}

// ---- chunking ----

/** Splits a document into store-sized chunks. Chunk 0 carries `<version>:<count>|`. */
export function toChunks(doc: string, chunkSize = CHUNK_SIZE): string[] {
  const headerMax = `${STORAGE_VERSION}:9999|`.length;
  const body = chunkSize - headerMax;
  const parts: string[] = [];
  for (let i = 0; i < doc.length || parts.length === 0; i += body) parts.push(doc.slice(i, i + body));
  parts[0] = `${STORAGE_VERSION}:${parts.length}|${parts[0]}`;
  return parts;
}

/** Reads the chunk count from chunk 0 (to know how many keys to fetch). */
export function chunkCount(first: string): number {
  const m = /^(\d+):(\d+)\|/.exec(first);
  if (!m) throw new Error("bad chunk header");
  if (Number(m[1]) !== STORAGE_VERSION) throw new Error(`unsupported chunk version: ${m[1]}`);
  return Number(m[2]);
}

export function fromChunks(chunks: readonly string[]): string {
  const first = chunks[0];
  if (first === undefined) throw new Error("no chunks");
  const count = chunkCount(first);
  if (chunks.length < count) throw new Error(`expected ${count} chunks, got ${chunks.length}`);
  return first.slice(first.indexOf("|") + 1) + chunks.slice(1, count).join("");
}
