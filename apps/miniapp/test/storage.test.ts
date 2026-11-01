import { describe, expect, test } from "bun:test";
import { choose, emptyProfile, newNight, profileOf } from "@belvedere/engine";
import { miniWorld } from "../../../packages/engine/test/mini-world";
import { createSaves, decodeEnvelope, encodeEnvelope, localKV, saveDoc, type KV, type StorageLike } from "../src/storage";
import { serializeProfile, serializeRun } from "@belvedere/engine";

function fakeStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => { m.set(k, v); },
    removeItem: (k) => { m.delete(k); },
  };
}

/** In-memory KV with controllable failures and a write counter. */
function fakeKV(opts: { fail?: () => boolean; delay?: number } = {}) {
  const m = new Map<string, string>();
  let writes = 0;
  const maybeFail = async () => {
    if (opts.delay) await Bun.sleep(opts.delay);
    if (opts.fail?.()) throw new Error("cloud down");
  };
  const kv: KV = {
    async get(keys) { await maybeFail(); const o: Record<string, string> = {}; for (const k of keys) { const v = m.get(k); if (v !== undefined) o[k] = v; } return o; },
    async set(k, v) { await maybeFail(); writes++; m.set(k, v); },
    async remove(keys) { await maybeFail(); for (const k of keys) m.delete(k); },
    async keys() { await maybeFail(); return [...m.keys()]; },
  };
  return { kv, map: m, writes: () => writes };
}

const profileWith = (trust: number) => ({ v: 1 as const, profile: { trust } });

describe("saves transport", () => {
  test("local only: profile and run round-trip", async () => {
    const saves = createSaves(localKV(fakeStorage()));
    let s = newNight(profileWith(2), miniWorld, 9);
    s = choose(s, miniWorld, 1);
    saves.persistRun(s);
    saves.persistProfile(profileOf(s));
    await saves.flush();
    const p = await saves.loadProfile();
    expect(p).toEqual(profileOf(s));
    expect(await saves.loadRun(p!)).toEqual(s);
  });

  test("cloud write failure is silent and load falls back to local", async () => {
    const cloud = fakeKV({ fail: () => true });
    const saves = createSaves(localKV(fakeStorage()), cloud.kv);
    saves.persistProfile(profileWith(5));
    await saves.flush(); // does not throw
    expect(cloud.map.size).toBe(0);
    expect((await saves.loadProfile())?.profile["trust"]).toBe(5);
  });

  test("cloud read failure falls back to local", async () => {
    let down = false;
    const cloud = fakeKV({ fail: () => down });
    const saves = createSaves(localKV(fakeStorage()), cloud.kv);
    saves.persistProfile(profileWith(3));
    await saves.flush();
    expect(cloud.map.get("profile_0")).toBeDefined();
    down = true;
    expect((await saves.loadProfile())?.profile["trust"]).toBe(3);
  });

  test("equal rev: cloud copy wins", async () => {
    const cloud = fakeKV();
    const local = localKV(fakeStorage());
    await saveDoc(local, "profile", encodeEnvelope({ rev: 3, savedAt: 1, body: serializeProfile(profileWith(7)) }));
    await saveDoc(cloud.kv, "profile", encodeEnvelope({ rev: 3, savedAt: 2, body: serializeProfile(profileWith(1)) }));
    const saves = createSaves(local, cloud.kv);
    expect((await saves.loadProfile())?.profile["trust"]).toBe(1);
  });

  test("local rev 5 beats cloud rev 4 after an interrupted cloud write, and is pushed to cloud", async () => {
    const cloud = fakeKV();
    const local = localKV(fakeStorage());
    await saveDoc(local, "profile", encodeEnvelope({ rev: 5, savedAt: 50, body: serializeProfile(profileWith(5)) }));
    await saveDoc(cloud.kv, "profile", encodeEnvelope({ rev: 4, savedAt: 40, body: serializeProfile(profileWith(4)) }));
    const saves = createSaves(local, cloud.kv, () => 60);
    expect((await saves.loadProfile())?.profile["trust"]).toBe(5);
    await saves.flush();
    expect(decodeEnvelope(cloud.map.get("profile_0")!.slice(cloud.map.get("profile_0")!.indexOf("|") + 1))).toEqual({ rev: 5, savedAt: 50, body: "b1;q.trust=5" });
    // and the next persist continues the counter
    saves.persistProfile(profileWith(6));
    await saves.flush();
    expect(cloud.map.get("profile_0")).toContain("rev=6;at=60|");
  });

  test("cloud rev ahead (another device) wins and refreshes local", async () => {
    const cloud = fakeKV();
    const localStore = fakeStorage();
    const local = localKV(localStore);
    await saveDoc(local, "profile", encodeEnvelope({ rev: 2, savedAt: 1, body: serializeProfile(profileWith(2)) }));
    await saveDoc(cloud.kv, "profile", encodeEnvelope({ rev: 9, savedAt: 2, body: serializeProfile(profileWith(9)) }));
    const saves = createSaves(local, cloud.kv);
    expect((await saves.loadProfile())?.profile["trust"]).toBe(9);
    await saves.flush();
    expect(localStore.getItem("blv_profile_0")).toContain("rev=9;");
  });

  test("cloud read failure never triggers a blind push", async () => {
    let down = true;
    const cloud = fakeKV({ fail: () => down });
    const local = localKV(fakeStorage());
    await saveDoc(local, "profile", encodeEnvelope({ rev: 5, savedAt: 1, body: serializeProfile(profileWith(5)) }));
    const saves = createSaves(local, cloud.kv);
    expect((await saves.loadProfile())?.profile["trust"]).toBe(5);
    await saves.flush();
    down = false;
    expect(cloud.map.size).toBe(0);
  });

  test("tombstone: cleared run beats a stale cloud run", async () => {
    const cloud = fakeKV();
    const local = localKV(fakeStorage());
    const stale = newNight(emptyProfile(), miniWorld, 1);
    await saveDoc(cloud.kv, "run", encodeEnvelope({ rev: 3, savedAt: 1, body: serializeRun(stale) }));
    await saveDoc(local, "run", encodeEnvelope({ rev: 4, savedAt: 2, body: "" }));
    const saves = createSaves(local, cloud.kv);
    expect(await saves.loadRun(emptyProfile())).toBeNull();
    await saves.flush();
    expect(cloud.map.get("run_0")).toContain("rev=4;");
  });

  test("legacy document without envelope loads as rev 0", async () => {
    const local = localKV(fakeStorage());
    await saveDoc(local, "profile", serializeProfile(profileWith(8)));
    const saves = createSaves(local);
    expect((await saves.loadProfile())?.profile["trust"]).toBe(8);
    saves.persistProfile(profileWith(9));
    await saves.flush();
    expect(await saves.loadProfile()).toEqual(profileWith(9));
  });

  test("rapid saves coalesce: only the latest reaches the slow cloud", async () => {
    const cloud = fakeKV({ delay: 5 });
    const saves = createSaves(localKV(fakeStorage()), cloud.kv);
    for (let i = 1; i <= 10; i++) saves.persistProfile(profileWith(i));
    await saves.flush();
    expect(cloud.map.get("profile_0")).toContain("rev=10;");
    expect(cloud.map.get("profile_0")).toContain("|b1;q.trust=10");
    expect(cloud.writes()).toBeLessThan(10);
  });

  test("clearRun removes every chunk, also stale ones from a longer save", async () => {
    const local = fakeStorage();
    const saves = createSaves(localKV(local));
    const big = { v: 1 as const, profile: {} as Record<string, number> };
    for (let i = 0; i < 400; i++) big.profile[`visited.floor${i}.door`] = 1;
    const s = newNight(big, miniWorld, 1);
    s.run = big.profile; // make the run doc span several chunks
    saves.persistRun(s);
    await saves.flush();
    expect(local.length).toBeGreaterThan(1);
    saves.persistRun(newNight(emptyProfile(), miniWorld, 1));
    await saves.flush();
    expect(local.length).toBe(1);
    saves.clearRun();
    await saves.flush();
    expect(local.length).toBe(1); // tombstone stays
    expect(await saves.loadRun(emptyProfile())).toBeNull();
  });
});
