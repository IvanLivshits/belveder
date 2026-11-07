/** Night loop v2 on the tower world: the feed of lines, the rumor of the night, leads and vouchers,
 *  the stairs as one screen with encounters on the way, night-start rules and their place in a save. */
import { describe, expect, test } from "bun:test";
import {
  choose, continueOutcome, currentRumor, currentScene, emptyProfile, extendFeed, isResumable, leadsView, newNight, notebookView, openFeed,
  parseProfile, parseRun, profileOf, progressNotes, serializeProfile, serializeRun, travel, type GameState, type Profile,
} from "../src";
import { tower as w, towerVariant } from "./tower-world";

function pick(s: GameState, text: string, world = w): GameState {
  const c = currentScene(s, world).choices.find((c) => c.available && c.text === text);
  if (!c) throw new Error(`no choice "${text}" in ${s.storyletId}`);
  return choose(s, world, c.index);
}
const path = (s: GameState, ...texts: string[]) => texts.reduce((cur, t) => pick(cur, t), s);
const onStairs = (p: Profile = emptyProfile(), seed = 1) => path(newNight(p, w, seed), "To the landing", "Stairs");
const withRun = (s: GameState, run: Record<string, number>): GameState => ({ ...s, run: { ...s.run, ...run } });
const sleep = (s: GameState) => continueOutcome(pick(s, "Sleep"), w);

describe("feed", () => {
  test("a card speaks in lines: speaker, style, colour; a conditional line and the rumor line follow the state", () => {
    const s = newNight(emptyProfile(), w, 1);
    expect(openFeed(s, w)).toEqual({
      location: "lobby",
      entries: [
        { kind: "line", who: "narrator", label: "", color: null, style: "narrator", text: "Hall. Night 0." },
        { kind: "line", who: "ann", label: "ANN", color: "#aabbcc", style: "speech", text: "Pie tonight." },
      ],
    });
    // a later night: the inner voice joins in
    const later = openFeed(newNight({ v: 1, profile: { nights: 1, "met.ann": 1 } }, w, 1), w);
    expect(later.entries.at(-1)).toEqual({ kind: "line", who: "gut", label: "GUT", color: null, style: "inner", text: "Hm." });
    // { rumor: true } without a rumor is not drawn
    const quiet = towerVariant((x) => { x.rumors = []; delete x.rules.firstNightRumor; });
    expect(openFeed(newNight(emptyProfile(), quiet, 1), quiet).entries.map((e) => e.text)).toEqual(["Hall. Night 0."]);
  });

  test("a pick falls into the feed, then its reply; staying in place does not pause and does not repeat the card", () => {
    const s0 = newNight(emptyProfile(), w, 1);
    const f0 = openFeed(s0, w);
    const s1 = pick(s0, "Who are you?");
    expect(s1.phase).toBe("scene");
    const f1 = extendFeed(f0, s0, s1, w);
    expect(f1.entries.slice(2)).toEqual([
      { kind: "pick", mode: "say", text: "Who are you?" },
      { kind: "line", who: "ann", label: "ANN", color: "#aabbcc", style: "speech", text: "Ann. Turn 1." }, // rendered after the effects
    ]);
    const s2 = pick(s1, "Take the key");
    const f2 = extendFeed(f1, s1, s2, w);
    expect(f2.entries.slice(4)).toEqual([{ kind: "pick", mode: "do", text: "Take the key" }]);
    // another place: a new feed
    const s3 = pick(s2, "To the landing");
    expect(extendFeed(f2, s2, s3, w)).toEqual({ location: "f1", entries: [{ kind: "line", who: "narrator", label: "", color: null, style: "narrator", text: "One." }] });
  });

  test("a reply that ends the night (or leads elsewhere) pauses in phase outcome with the reply on screen", () => {
    const s0 = newNight(emptyProfile(), w, 1);
    const f0 = openFeed(s0, w);
    const s1 = pick(s0, "Sleep");
    expect(s1.phase).toBe("outcome");
    const f1 = extendFeed(f0, s0, s1, w);
    expect(f1.entries.slice(2).map((e) => e.text)).toEqual(["Sleep", "Good night."]);
    expect(openFeed(s1, w)).toEqual(f1); // a reloaded game shows the same
    const done = continueOutcome(s1, w);
    expect(done.phase).toBe("report");
    expect(extendFeed(f1, s1, done, w)).toBe(f1);
  });

  test("an old card with text and outcome is drawn as narrator lines, one per paragraph", () => {
    let s = onStairs();
    s = continueOutcome(pick(travel(s, w, 3), "No"), w); // Ann stops Nick on the third; he walks on
    expect(s.storyletId).toBe("f3_old");
    const f = openFeed(s, w);
    expect(f.entries).toEqual([
      { kind: "line", who: null, label: "", color: null, style: "narrator", text: "Old prose, floor 3." },
      { kind: "line", who: null, label: "", color: null, style: "narrator", text: "Second paragraph." },
    ]);
    expect(currentScene(s, w).choices.map((c) => [c.mode, c.text])).toEqual([["plain", "Look"], ["plain", "Jump"], ["plain", "Stairs"]]);
    const looked = pick(s, "Look");
    expect(looked.phase).toBe("scene"); // an outcome that stays in place goes on in the feed
    expect(extendFeed(f, s, looked, w).entries.slice(2).map((e) => [e.kind, e.text])).toEqual([["pick", "Look"], ["line", "You look."], ["line", "Nothing."]]);
    const jumped = pick(looked, "Jump");
    expect(jumped.phase).toBe("outcome"); // an outcome before a goto still waits for the player
    expect(continueOutcome(jumped, w).location).toBe("lobby");
  });
});

describe("rumor of the night", () => {
  test("the first night always draws rules.firstNightRumor", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = newNight(emptyProfile(), w, seed);
      expect(currentRumor(s, w)?.id).toBe("pie");
      expect(s.run["rumor.pie"]).toBe(1);
    }
  });

  test("later nights draw by seed among rumors whose when holds, never the one of the night before", () => {
    let profile = profileOf(sleep(newNight(emptyProfile(), w, 1)));
    const drawn: string[] = ["pie"];
    for (let n = 0; n < 40; n++) {
      const s = newNight(profile, w, 100 + n);
      const id = currentRumor(s, w)!.id;
      expect(id).not.toBe(drawn.at(-1)!);
      expect(Object.keys(s.run).filter((k) => k.startsWith("rumor."))).toEqual([`rumor.${id}`]);
      drawn.push(id);
      profile = profileOf(sleep(s));
    }
    expect(new Set(drawn)).toEqual(new Set(["pie", "dark"])); // "late" needs met.ann
    expect(profile.history!.nights.map((r) => r.rumor)).toEqual(drawn);
    // same seed, same rumor; and the night's record survives a save
    expect(currentRumor(newNight(profile, w, 7), w)).toEqual(currentRumor(newNight(profile, w, 7), w));
    expect(parseProfile(serializeProfile(profile))).toEqual(profile);
    const met: Profile = { ...profile, profile: { ...profile.profile, "met.ann": 1 } };
    const seen = new Set(Array.from({ length: 40 }, (_, i) => currentRumor(newNight(met, w, 500 + i), w)!.id));
    expect(seen.has("late")).toBe(true);
  });

  test("a world without rumors draws nothing and spends no randomness", () => {
    const quiet = towerVariant((x) => { x.rumors = []; delete x.rules.firstNightRumor; });
    const s = newNight({ v: 1, profile: { nights: 3 } }, quiet, 9);
    expect(currentRumor(s, quiet)).toBeUndefined();
    expect(s.rng).toBe(9);
  });
});

describe("stairs", () => {
  test("one screen: a button per other floor, half a move per floor rounded up, locks, the free way back", () => {
    const s = onStairs();
    const v = currentScene(s, w).stairs!;
    expect(v.current).toBe(1);
    expect(v.floors.map((f) => [f.floor, f.location, f.cost, f.locked])).toEqual([[2, "f2", 1, null], [3, "f3", 1, null], [4, "f4", 2, null], [5, "f5", 2, "Locked"]]);
    expect(v.back).toEqual({ floor: 1, location: "f1", label: "Landing 1" });
    expect(currentScene(s, w).choices).toEqual([]);
    expect(() => travel(s, w, 5)).toThrow(/locked/);
    expect(() => travel(s, w, 9)).toThrow(/no floor 9/);
    expect(() => travel(newNight(emptyProfile(), w, 1), w, 2)).toThrow(/not a stairs screen/);
    // either group of open_any opens the lock
    expect(currentScene(withRun(s, { "has.key": 1 }), w).stairs!.floors[3]!.locked).toBeNull();
    expect(currentScene(withRun(s, { "has.pass": 1 }), w).stairs!.floors[3]!.locked).toBeNull();
    // the dark rumor makes every walk one move longer
    expect(currentScene(withRun(s, { "rumor.dark": 1 }), w).stairs!.floors.map((f) => f.cost)).toEqual([2, 2, 3, 3]);
  });

  test("a walk sets the floor, costs its price instead of the usual move, applies onTravel; the way back is free", () => {
    const s = onStairs();
    expect(s.run["turn"]).toBeUndefined();
    const up = travel(s, w, 2);
    expect(up.location).toBe("f2");
    expect(up.run).toMatchObject({ floor: 2, turn: 1, "seen.walked": 1 });
    expect(up.log.at(-1)).toEqual({ storylet: "stairs", choice: -1, floor: 2 });
    const far = travel(withRun(s, { "has.pass": 1, "seen.ev3": 1 }), w, 5);
    expect(far.location).toBe("f5");
    expect(far.run["turn"]).toBe(2);
    const back = travel(s, w, 1);
    expect(back.location).toBe("f1");
    expect(back.run["turn"]).toBeUndefined();
    expect(back.run["seen.walked"]).toBeUndefined();
    // a saved walk reloads
    expect(parseRun(serializeRun(up), profileOf(up))).toEqual(up);
  });

  test("an encounter with floors [3, 3] fires on the way 1 -> 4, not on 4 -> 5; a choice without goto walks on", () => {
    const met = travel(onStairs(), w, 4);
    expect(met.location).toBe("event");
    expect(met.storyletId).toBe("ev_three");
    expect(met.run).toMatchObject({ floor: 4, turn: 2 });
    const refused = pick(met, "No");
    expect(refused.phase).toBe("outcome"); // the reply is read on the stairs
    const landed = continueOutcome(refused, w);
    expect(landed.location).toBe("f4");
    expect(landed.run["turn"]).toBe(2); // the answer was free
    // a choice with goto leaves the walk
    expect(pick(met, "Coming").location).toBe("room");
    // 4 -> 5 does not pass the third floor
    const fromFour = pick(withRun(travel(withRun(onStairs(), { "seen.ev3": 1 }), w, 4), { "seen.ev3": 0, "has.pass": 1 }), "Stairs");
    expect(currentScene(fromFour, w).stairs!.current).toBe(4);
    expect(travel(fromFour, w, 5).location).toBe("f5");
    // down from the fourth it does
    expect(travel(fromFour, w, 1).storyletId).toBe("ev_three");
  });

  test("one encounter per walk, the highest priority; an encounter without floors can happen anywhere; interrupts come first", () => {
    const keyed = withRun(onStairs(), { "has.key": 1 });
    expect(travel(keyed, w, 3).storyletId).toBe("ev_three"); // 5 beats the cat's 1
    const cat = travel(keyed, w, 2); // the second floor is not on Ann's way
    expect(cat.storyletId).toBe("ev_cat");
    const passed = pick(cat, "Pass"); // free, no reply: straight on to the landing
    expect(passed.location).toBe("f2");
    expect(passed.run["turn"]).toBe(1);
    // dawn on the stairs: the interrupt wins over the encounter and the landing
    const late = travel(withRun(keyed, { turn: 8 }), w, 3);
    expect(late.location).toBe("lobby");
    expect(late.run["turn"]).toBe(9);
  });
});

describe("leads, paperclips and vouchers", () => {
  test("a lead appears on its when and closes on its done; progress counts them", () => {
    let s = newNight(emptyProfile(), w, 1);
    expect(leadsView(s, w)).toEqual({ open: [{ id: "ann", text: "Who is she?", answer: "Ann.", done: false }], closed: [], total: 1, done: 0 });
    expect(notebookView(s, w)!.vouchers).toBeNull();
    expect(progressNotes(s, w)).toEqual(["Leads 0/1, turn 0"]);
    s = pick(s, "Who are you?");
    const leads = notebookView(s, w)!.leads;
    expect(leads.open.map((l) => l.id)).toEqual(["room"]);
    expect(leads.closed).toEqual([{ id: "ann", text: "Who is she?", answer: "Ann.", done: true }]);
    expect([leads.done, leads.total]).toEqual([1, 2]);
    expect(notebookView(s, w)!.vouchers).toEqual({ title: "Vouchers", lines: ["—", "—", "—"], footer: "Three needed." });
    expect(progressNotes(s, w)).toEqual(["Leads 1/2, turn 1", "Vouched 0"]);
  });

  test("a paperclip marks the choice that goes where an open lead points, and that floor on the stairs", () => {
    const fresh = pick(newNight(emptyProfile(), w, 1), "To the landing");
    expect(currentScene(fresh, w).choices.map((c) => [c.text, c.lead])).toEqual([["Stairs", false], ["Hall", true]]); // "Who is she?" -> lobby
    const s = onStairs({ v: 1, profile: { "met.ann": 1 } }); // now the room lead is open instead
    expect(currentScene(s, w).stairs!.floors.map((f) => [f.floor, f.lead])).toEqual([[2, true], [3, false], [4, false], [5, false]]);
    const landing = travel(s, w, 2);
    const doors = currentScene(landing, w).doors;
    expect(doors.map((d) => [d.text, d.available, d.lead])).toEqual([["Door", true, true], ["Hall", false, false], ["Stairs", true, false]]);
    // the door's other variant shows once Nick knows the room; the lead is closed, the clip is gone
    const known: GameState = { ...landing, profile: { ...landing.profile, "knows.room": 1 } };
    expect(currentScene(known, w).doors.map((d) => [d.text, d.lead])).toEqual([["Room 2-B", false], ["Hall", false], ["Stairs", false]]);
    expect(currentScene(known, w).choices.length).toBe(4);
  });

  test("vouchers are listed in the order they were earned, and the order survives a save", () => {
    let s = path(newNight(emptyProfile(), w, 1), "Who are you?", "To the landing", "Stairs");
    s = path(travel(s, w, 2), "Door", "Befriend Bob", "Befriend Ann");
    expect(s.history.vouchers).toEqual(["vouch.bob", "vouch.ann"]);
    expect(notebookView(s, w)!.vouchers!.lines).toEqual(["Bob", "Ann", "—"]);
    expect(progressNotes(pick(s, "Search"), w)).toEqual(["Leads 2/2, turn 6", "Vouched 2"]);
    const saved = parseProfile(serializeProfile(profileOf(s)));
    expect(saved).toEqual(profileOf(s));
    expect(notebookView(newNight(saved, w, 2), w)!.vouchers!.lines).toEqual(["Bob", "Ann", "—"]);
    // a profile without vouchers serializes as before they existed
    expect(serializeProfile(emptyProfile())).toBe("b1");
    expect(newNight(emptyProfile(), w, 1).history).toEqual({ nights: [], pledges: [] });
  });
});

describe("night start", () => {
  test("onNightStart effects apply to every night's fresh run", () => {
    expect(newNight(emptyProfile(), w, 1).run["has.tag"]).toBe(1);
    expect(newNight({ v: 1, profile: { nights: 4, "met.ann": 1 } }, w, 2).run["has.tag"]).toBe(1);
  });

  test("migrations are all checked on the profile as it arrived, then applied; a profile they fixed is left alone", () => {
    const old = newNight({ v: 1, profile: { nights: 2, "knows.old": 1 } }, w, 1);
    expect(old.profile).toMatchObject({ "met.ann": 1, "knows.room": 1 });
    const again = newNight(profileOf(old), w, 2);
    expect(again.profile).toEqual(old.profile);
    expect(newNight({ v: 1, profile: { nights: 2, "met.ann": 1, "knows.old": 1 } }, w, 1).profile["knows.room"]).toBeUndefined();
    expect(newNight({ v: 1, profile: { nights: 1, "knows.old": 1 } }, w, 1).profile).toEqual({ nights: 1, "knows.old": 1, "met.ann": 1 });
    expect(newNight(emptyProfile(), w, 1).profile).toEqual({});
  });

  test("a saved run is resumable only while its card and pending choice still exist", () => {
    const s = pick(newNight(emptyProfile(), w, 1), "Sleep");
    expect(isResumable(s, w)).toBe(true);
    expect(parseRun(serializeRun(s), profileOf(s))).toEqual(s);
    expect(isResumable({ ...s, storyletId: "stairs_upper" }, w)).toBe(false);
    expect(isResumable({ ...s, pendingChoice: 9 }, w)).toBe(false);
  });
});
