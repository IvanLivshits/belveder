import { describe, expect, test } from "bun:test";
import { choose, emptyProfile, newNight, profileOf } from "@belvedere/engine";
import { miniWorld } from "../../../packages/engine/test/mini-world";
import { createSaves, localKV, type KV, type StorageLike } from "../src/storage";

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

  test("cloud copy wins when both exist", async () => {
    const cloud = fakeKV();
    const local = fakeStorage();
    const saves = createSaves(localKV(local), cloud.kv);
    saves.persistProfile(profileWith(1));
    await saves.flush();
    local.setItem("blv_profile_0", "1:1|b1;q.trust=7"); // another device would have written cloud; here we poke local
    expect((await saves.loadProfile())?.profile["trust"]).toBe(1);
  });

  test("rapid saves coalesce: only the latest reaches the slow cloud", async () => {
    const cloud = fakeKV({ delay: 5 });
    const saves = createSaves(localKV(fakeStorage()), cloud.kv);
    for (let i = 1; i <= 10; i++) saves.persistProfile(profileWith(i));
    await saves.flush();
    expect(cloud.map.get("profile_0")).toBe("1:1|b1;q.trust=10");
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
    expect(local.length).toBe(0);
  });
});
