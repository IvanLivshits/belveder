import { describe, expect, test } from "bun:test";
import {
  CHUNK_SIZE, choose, continueOutcome, emptyProfile, fromChunks, newNight, parseProfile, parseRun, pledge,
  profileOf, serializeProfile, serializeRun, toChunks, type Profile,
} from "../src";
import { miniWorld } from "./mini-world";

describe("storage codec", () => {
  test("profile round-trips, keeping explicit zeros (non-zero defaults)", () => {
    const p: Profile = { v: 1, profile: { nights: 3, "mem.false.a": 0, "visited.floor2.tenant": 1 }, history: { nights: [], pledges: [] } };
    const doc = serializeProfile(p);
    expect(doc).toBe("b1;q.mem.false.a=0;q.nights=3;q.visited.floor2.tenant=1");
    expect(parseProfile(doc)).toEqual(p);
  });

  test("large profile splits into chunks under the CloudStorage limit and comes back intact", () => {
    const profile: Profile = { v: 1, profile: {}, history: { nights: [], pledges: [] } };
    for (let i = 0; i < 1500; i++) profile.profile[`visited.floor${i % 12}.door_${i}`] = (i % 7) + 1;
    const doc = serializeProfile(profile);
    expect(doc.length).toBeGreaterThan(CHUNK_SIZE * 3);
    const chunks = toChunks(doc);
    expect(chunks.length).toBeGreaterThan(3);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(4096);
    expect(chunks[0]!.startsWith(`1:${chunks.length}|`)).toBe(true);
    expect(parseProfile(fromChunks(chunks))).toEqual(profile);
  });

  test("empty document still yields one chunk", () => {
    const chunks = toChunks(serializeProfile(emptyProfile()));
    expect(chunks).toEqual(["1:1|b1"]);
    expect(parseProfile(fromChunks(chunks))).toEqual(emptyProfile());
  });

  test("run round-trips including rng position and log", () => {
    let s = newNight({ v: 1, profile: { trust: 2 } }, miniWorld, 99);
    s = choose(s, miniWorld, 1);
    s = choose(s, miniWorld, 0);
    const restored = parseRun(fromChunks(toChunks(serializeRun(s))), { v: 1, profile: { trust: 2 } });
    expect(restored).toEqual(s);
    expect(choose(restored, miniWorld, 0)).toEqual(choose(s, miniWorld, 0));
  });

  test("outcome phase and pledge log entries round-trip", () => {
    let s = newNight(emptyProfile(), miniWorld, 3);
    s = choose(s, miniWorld, 0); // room
    s = choose(s, miniWorld, 2); // vault with outcome
    expect(s.phase).toBe("outcome");
    expect(parseRun(serializeRun(s), profileOf(s))).toEqual(s);
    s = continueOutcome(s, miniWorld);
    s = pledge(s, miniWorld, "a");
    expect(s.log.at(-1)).toEqual({ storylet: "vault_pledge", choice: -1, pair: "a" });
    expect(parseRun(serializeRun(s), profileOf(s))).toEqual(s);
  });

  test("report phase run round-trips", () => {
    let s = newNight(emptyProfile(), miniWorld, 5);
    s = choose(s, miniWorld, 2);
    expect(s.phase).toBe("report");
    expect(parseRun(serializeRun(s), profileOf(s))).toEqual(s);
  });

  test("rejects unknown versions", () => {
    expect(() => parseProfile("b9;q.x=1")).toThrow(/version/);
    expect(() => fromChunks(["2:1|b1"])).toThrow(/version/);
  });
});
