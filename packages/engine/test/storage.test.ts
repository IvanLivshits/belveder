import { describe, expect, test } from "bun:test";
import {
  CHUNK_SIZE, choose, emptyProfile, fromChunks, newNight, parseProfile, parseRun,
  profileOf, serializeProfile, serializeRun, toChunks, type Profile,
} from "../src";
import { miniWorld } from "./mini-world";

describe("storage codec", () => {
  test("profile round-trips and drops zeros", () => {
    const p: Profile = { v: 1, profile: { nights: 3, trust: 0, "visited.floor2.tenant": 1 } };
    const doc = serializeProfile(p);
    expect(doc).toBe("b1;q.nights=3;q.visited.floor2.tenant=1");
    expect(parseProfile(doc)).toEqual({ v: 1, profile: { nights: 3, "visited.floor2.tenant": 1 } });
  });

  test("large profile splits into chunks under the CloudStorage limit and comes back intact", () => {
    const profile: Profile = { v: 1, profile: {} };
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
