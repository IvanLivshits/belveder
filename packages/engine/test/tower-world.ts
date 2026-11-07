import { WorldSchema, type World, type WorldInput } from "@belvedere/content-schema";

/** A five-floor tower for the night loop v2: lines and replies, a rumor a night, leads and vouchers,
 *  the stairs as one screen with a lock and two encounters. Floor 3 is written in the old text/outcome format. */
export const towerInput: WorldInput = {
  id: "tower",
  title: "Tower",
  qualities: [
    { id: "turn", scope: "run", min: 0, max: 12 },
    { id: "floor", scope: "run" },
    { id: "seen.*", scope: "run" },
    { id: "has.*", scope: "run" },
    { id: "rumor.*", scope: "run", min: 0, max: 1 },
    { id: "nights", scope: "profile" },
    { id: "met.*", scope: "profile" },
    { id: "knows.*", scope: "profile" },
    { id: "vouch.*", scope: "profile", min: 0, max: 1 },
    { id: "vouches", scope: "profile" },
  ],
  locations: [
    { id: "lobby", label: "Lobby" }, { id: "stairwell" }, { id: "event" }, { id: "room" },
    { id: "f1", label: "Landing 1" }, { id: "f2", label: "Landing 2" }, { id: "f3", label: "Landing 3" }, { id: "f4" }, { id: "f5" },
  ],
  rules: {
    start: "lobby",
    onChoice: ["turn += 1"],
    onNightStart: ["has.tag = 1"],
    firstNightRumor: "pie",
    // Both lines look at the profile as it arrived: the second still fires although the first sets met.ann.
    migrations: [
      { when: ["knows.old == 1", "met.ann == 0"], effects: ["met.ann = 1"] },
      { when: ["knows.old == 1", "met.ann == 0", "nights >= 2"], effects: ["knows.room = 1"] },
    ],
    interrupts: [{ when: ["turn >= 9"], goto: "lobby" }],
    onNightEnd: ["nights += 1"],
  },
  speakers: {
    narrator: { label: "", style: "narrator" },
    gut: { label: "GUT", style: "inner" },
    ann: { label: "ANN", color: "#aabbcc" },
  },
  rumors: [
    { id: "pie", text: "Pie tonight." },
    { id: "dark", text: "Lights are out." },
    { id: "late", when: ["met.ann == 1"], text: "Ann is late." },
  ],
  stairs: {
    location: "stairwell",
    quality: "floor",
    floors: { 1: "f1", 2: "f2", 3: "f3", 4: "f4", 5: "f5" },
    costMods: [{ when: ["rumor.dark == 1"], add: 1 }],
    locks: [{ floor: 5, open_any: [["has.key == 1"], ["has.pass == 1"]], text: "Locked" }],
    events: "event",
    onTravel: ["seen.walked = 1"],
  },
  report: {
    slots: [{ id: "summary" }],
    progress: [{ text: "Leads {leads_done}/{leads_total}, turn {turn}" }, { when: ["met.ann == 1"], text: "Vouched {vouches}" }],
  },
  notebook: {
    life: { title: "Me", intro: "i", states: { fake: "{label_fake}", empty: "x", real: "{label_real}" }, footer: { text: "f" } },
    pages: [],
    leads: [
      { id: "ann", text: "Who is she?", target: "lobby", done: ["met.ann == 1"], answer: "Ann." },
      { id: "room", when: ["met.ann == 1"], text: "What is in the room?", target: "room", done: ["knows.room == 1"], answer: "Dust." },
    ],
    vouchers: { title: "Vouchers", when: ["met.ann == 1"], slots: 3, empty: "—", names: { "vouch.ann": "Ann", "vouch.bob": "Bob" }, footer: "Three needed." },
  },
  storylets: [
    {
      id: "lobby_hi", location: "lobby", background: "bg",
      lines: [
        { who: "narrator", text: "Hall. Night {nights}." },
        { who: "ann", rumor: true },
        { who: "gut", text: "Hm.", when: ["nights >= 1"] },
      ],
      choices: [
        { say: "Who are you?", effects: ["met.ann = 1"], reply: [{ who: "ann", text: "Ann. Turn {turn}." }, { who: "gut", text: "Never shown.", when: ["turn >= 99"] }] },
        { do: "Take the key", effects: ["has.key = 1"] },
        { text: "To the landing", free: true, effects: ["floor = 1"], goto: "f1" },
        { do: "Sleep", free: true, reply: [{ who: "ann", text: "Good night." }], endNight: true },
      ],
    },
    { id: "f1_landing", location: "f1", background: "bg", lines: [{ who: "narrator", text: "One." }], choices: [{ text: "Stairs", free: true, effects: ["floor = 1"], goto: "stairwell" }, { text: "Hall", free: true, goto: "lobby" }] },
    {
      // Two variants of the room door: the same goto, opposite conditions.
      id: "f2_doors", location: "f2", layout: "doors", background: "bg", lines: [{ who: "narrator", text: "Two." }],
      choices: [
        { text: "Door", when: ["knows.room == 0"], effects: ["floor = 2"], goto: "room" },
        { text: "Room 2-B", when: ["knows.room == 1"], effects: ["floor = 2"], goto: "room" },
        { text: "Hall", when: ["has.key == 1"], goto: "lobby" },
        { text: "Stairs", free: true, effects: ["floor = 2"], goto: "stairwell" },
      ],
    },
    {
      // Old format: prose text, prose outcome.
      id: "f3_old", location: "f3", background: "bg", text: "Old prose, floor {floor}.\n\nSecond paragraph.",
      choices: [
        { text: "Look", outcome: "You look.\n\nNothing." },
        { text: "Jump", outcome: "Down you go.", goto: "lobby" },
        { text: "Stairs", free: true, effects: ["floor = 3"], goto: "stairwell" },
      ],
    },
    { id: "f4_landing", location: "f4", background: "bg", lines: [{ who: "narrator", text: "Four." }], choices: [{ text: "Stairs", free: true, effects: ["floor = 4"], goto: "stairwell" }] },
    { id: "f5_landing", location: "f5", background: "bg", lines: [{ who: "narrator", text: "Five." }], choices: [{ text: "Stairs", free: true, effects: ["floor = 5"], goto: "stairwell" }] },
    { id: "stairs", location: "stairwell", layout: "stairs", background: "bg", lines: [{ who: "narrator", text: "Steps." }], choices: [] },
    {
      id: "ev_three", location: "event", priority: 5, floors: [3, 3], when: ["seen.ev3 == 0"], background: "bg", lines: [{ who: "ann", text: "Stop." }],
      choices: [
        { say: "Coming", effects: ["seen.ev3 = 1", "floor = 2"], goto: "room" },
        { say: "No", free: true, effects: ["seen.ev3 = 1"], reply: [{ who: "ann", text: "Fine." }] },
      ],
    },
    {
      id: "ev_cat", location: "event", priority: 1, when: ["seen.cat == 0", "has.key == 1"], background: "bg", lines: [{ who: "narrator", text: "A cat." }],
      choices: [{ do: "Pass", free: true, effects: ["seen.cat = 1"] }],
    },
    {
      id: "room_in", location: "room", background: "bg", lines: [{ who: "narrator", text: "Room." }],
      choices: [
        { do: "Search", effects: ["knows.room = 1"] },
        { do: "Befriend Bob", when: ["vouch.bob == 0"], effects: ["vouch.bob = 1", "vouches += 1"] },
        { do: "Befriend Ann", when: ["vouch.ann == 0"], effects: ["vouch.ann = 1", "vouches += 1"] },
        { text: "Leave", free: true, goto: "f2" },
      ],
    },
  ],
  fragments: [{ id: "sum", slot: "summary", text: "x" }],
};
export const tower: World = WorldSchema.parse(towerInput);
export const towerVariant = (patch: (w: WorldInput) => void): World => {
  const w = structuredClone(towerInput);
  patch(w);
  return WorldSchema.parse(w);
};
