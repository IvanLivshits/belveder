import { WorldSchema, type World } from "@belvedere/content-schema";

/** Self-contained world: two locations, a turn limit, one report slot. */
export const miniWorld: World = WorldSchema.parse({
  id: "mini",
  title: "Mini",
  qualities: [
    { id: "turn", scope: "run" },
    { id: "heat", scope: "run", min: 0, max: 5 },
    { id: "nights", scope: "profile" },
    { id: "trust", scope: "profile" },
    { id: "seen.*", scope: "run" },
    { id: "mem.false.*", scope: "profile", default: 1 },
    { id: "mem.true.*", scope: "profile" },
    { id: "night_pledged", scope: "run" },
    { id: "pledged.*", scope: "run" },
    { id: "returned.*", scope: "run" },
    { id: "returned_tonight", scope: "run" },
    { id: "memories_returned", scope: "profile" },
    { id: "endings.*", scope: "profile" },
  ],
  locations: [{ id: "hall" }, { id: "room" }, { id: "vault" }],
  memories: [
    { id: "a", fake: "mem.false.a", real: "mem.true.a", label_fake: "False A", label_real: "True A", returnWhen: ["trust >= 1"] },
    { id: "b", fake: "mem.false.b", real: "mem.true.b", label_fake: "False B", label_real: "True B", returnWhen: ["heat >= 9"] },
  ],
  // Turn 4 sends the player to the vault (pledge screen); the night only ends there.
  rules: {
    start: "hall", onChoice: ["turn += 1"], clock: { quality: "turn", start: "22:00", step: 30 },
    interrupts: [{ when: ["turn >= 4"], goto: "vault" }], onNightEnd: ["nights += 1"], pledgedNightWhen: ["night_pledged == 1"],
  },
  report: { slots: [{ id: "summary", label: "Summary" }] },
  storylets: [
    {
      id: "hall_a", location: "hall", priority: 1, when: ["seen.hall_a == 0"], background: "bg",
      text: "A", choices: [
        { text: "go room", effects: ["seen.hall_a = 1"], goto: "room" },
        { text: "wait", effects: ["seen.hall_a = 1", "heat += 1"] },
        { text: "leave now", endNight: true, free: true },
      ],
    },
    { id: "hall_b", location: "hall", background: "bg", text: "B", choices: [{ text: "go room", goto: "room" }] },
    { id: "hall_c", location: "hall", background: "bg", text: "C", choices: [{ text: "go room", goto: "room" }] },
    {
      id: "room_x", location: "room", background: "bg", text: "X heat={heat}", choices: [
        { text: "trust", effects: ["trust += 1"], goto: "hall" },
        { text: "hidden", when: ["heat >= 1"], effects: ["heat -= 1"], goto: "hall" },
        { text: "vault", effects: ["heat += 2"], outcome: "Heat is now {heat}, trust {trust}.", goto: "vault" },
      ],
    },
    {
      id: "vault_pledge", location: "vault", layout: "pledge", background: "bg", text: "Pawn one.", choices: [
        { text: "pledge the night", free: true, effects: ["night_pledged = 1"], endNight: true },
        // The game's one ending: only once something real came back.
        { text: "burn it all", when: ["trust >= 2"], free: true, ending: "fire", outcome: "It burns." },
      ],
    },
  ],
  fragments: [
    { id: "sum_default", slot: "summary", priority: -100, text: "nothing (heat {heat})" },
    { id: "sum_trust", slot: "summary", when: ["trust >= 1"], text: "trusted" },
    { id: "sum_returned", slot: "summary", priority: 1, when: ["returned.a == 1"], text: "a came back" },
  ],
  endings: {
    endings: [
      { id: "fire", title: "Fire", image: "bg", text: "The vault burns.\n\nNothing is left, trust {trust}.", epilogues: [{ text: "Ash." }, { when: ["endings.water == 1"], text: "Steam, too." }] },
      { id: "water", title: "Water", image: "bg", text: "Unreachable here." },
    ],
    story: { title: "The Case", parts: ["opening", "nights", "pledged_note", "litany", "ending", "epilogues"], pledged_note: "Some nights are gone.", litany_intro: "Paid:", closing: "The end." },
  },
});
