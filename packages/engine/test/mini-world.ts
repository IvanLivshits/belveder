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
  ],
  locations: [{ id: "hall" }, { id: "room" }],
  rules: { start: "hall", onChoice: ["turn += 1"], nightEndWhen: ["turn >= 4"], onNightEnd: ["nights += 1"] },
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
      id: "room_x", location: "room", background: "bg", text: "X", choices: [
        { text: "trust", effects: ["trust += 1"], goto: "hall" },
        { text: "hidden", when: ["heat >= 1"], effects: ["heat -= 1"], goto: "hall" },
      ],
    },
  ],
  fragments: [
    { id: "sum_default", slot: "summary", priority: -100, text: "nothing" },
    { id: "sum_trust", slot: "summary", when: ["trust >= 1"], text: "trusted" },
  ],
});
