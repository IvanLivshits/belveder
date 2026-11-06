import { z } from "zod";
import { ConditionSchema, EffectSchema, QUALITY_DECL_RE, QUALITY_ID_RE } from "./expressions";

const Id = z.string().regex(/^[a-z][a-z0-9_]*$/, "id must be snake_case");
export const QualityIdSchema = z.string().regex(QUALITY_ID_RE, "quality id must be dotted snake_case");

export const QualityScopeSchema = z.enum(["run", "profile"]);
export type QualityScope = z.infer<typeof QualityScopeSchema>;

export const QualityDefSchema = z.object({
  id: z.string().regex(QUALITY_DECL_RE, "quality id must be dotted snake_case, optionally ending with `.*`"),
  scope: QualityScopeSchema,
  label: z.string().optional(),
  default: z.number().int().default(0),
  min: z.number().int().optional(),
  max: z.number().int().optional(),
  /** Shown in the HUD bar. */
  visible: z.boolean().default(false),
  /** One line the UI shows the first time this quality changes value (tracked by the app, not the world). */
  hint: z.string().min(1).optional(),
});
export type QualityDef = z.infer<typeof QualityDefSchema>;

/** `outdoor` switches on weather overlays (rain, lightning) in the UI; indoors stay still. */
export const LocationSchema = z.object({ id: Id, label: z.string().optional(), outdoor: z.boolean().default(false) });
export type Location = z.infer<typeof LocationSchema>;

/** One line of the scene feed. `who` is a key of `world.speakers`. A line carries either its own
 *  `text` or `rumor: true` (the text of tonight's rumor in that speaker's voice; skipped without one). */
export const LineSchema = z.object({
  who: Id,
  text: z.string().min(1).optional(),
  rumor: z.boolean().default(false),
  when: z.array(ConditionSchema).default([]),
}).refine((l) => (l.text !== undefined) !== l.rumor, "a line needs either text or rumor: true");
export type Line = z.infer<typeof LineSchema>;

/** A choice is labelled by exactly one of `say` (the player's line, "— …"), `do` (an action, "[…]")
 *  or `text` (a plain button: doors, old cards). The validator rejects a choice without any. */
export const ChoiceSchema = z.object({
  text: z.string().min(1).optional(),
  say: z.string().min(1).optional(),
  do: z.string().min(1).optional(),
  when: z.array(ConditionSchema).default([]),
  effects: z.array(EffectSchema).default([]),
  goto: Id.optional(),
  /** Old format of `reply`: prose after the effects are applied; every paragraph becomes a narrator line. */
  outcome: z.string().min(1).optional(),
  /** Lines that follow the choice in the feed, after its effects are applied. */
  reply: z.array(LineSchema).min(1).optional(),
  /** Ends the night right after effects. */
  endNight: z.boolean().default(false),
  /** Skip `rules.onChoice` (e.g. does not cost a turn). */
  free: z.boolean().default(false),
  /** Finishes the game with this ending (from `endings.yaml`) after the outcome, if any. */
  ending: Id.optional(),
});
export type Choice = z.infer<typeof ChoiceSchema>;

/** scene: lines + choices. doors: three doors (choices with the same goto are variants of one door).
 *  pledge: pick a false memory to pawn, or a plain choice. stairs: only the text; the floor buttons come from `world.stairs`. */
export const LayoutSchema = z.enum(["scene", "doors", "pledge", "stairs"]);
export type Layout = z.infer<typeof LayoutSchema>;

export const StoryletSchema = z.object({
  id: Id,
  location: Id,
  priority: z.number().int().default(0),
  when: z.array(ConditionSchema).default([]),
  layout: LayoutSchema.default("scene"),
  /** One-off intro card: its choices may flip the flag that excludes it (validator skips the self-exclusion warning). */
  intro: z.boolean().default(false),
  background: Id,
  portrait: Id.optional(),
  title: z.string().optional(),
  /** Old format of `lines`: prose, every paragraph becomes a narrator line. */
  text: z.string().min(1).optional(),
  lines: z.array(LineSchema).min(1).optional(),
  /** Encounter on the stairs (location `stairs.events`): shown only when the walked path crosses [from, to]. */
  floors: z.tuple([z.number().int(), z.number().int()]).optional(),
  choices: z.array(ChoiceSchema),
}).superRefine((s, ctx) => {
  if (s.text === undefined && s.lines === undefined) ctx.addIssue({ code: "custom", message: "a storylet needs lines or text" });
  if (s.choices.length === 0 && s.layout !== "stairs") ctx.addIssue({ code: "custom", path: ["choices"], message: "only a stairs layout may have no choices" });
});
export type Storylet = z.infer<typeof StoryletSchema>;

export const ReportFragmentSchema = z.object({
  id: Id,
  slot: Id,
  priority: z.number().int().default(0),
  when: z.array(ConditionSchema).default([]),
  text: z.string().min(1),
});
export type ReportFragment = z.infer<typeof ReportFragmentSchema>;

/** Small print above the report page; every note whose conditions hold is shown. */
export const ReportNoteSchema = z.object({
  when: z.array(ConditionSchema).default([]),
  text: z.string().min(1),
});
export type ReportNote = z.infer<typeof ReportNoteSchema>;

/** Nick's notebook: reference pages that unlock on profile qualities, plus the
 *  "what I know about myself" page assembled from memory pairs. */
export const NotebookPageSchema = z.object({
  id: Id,
  title: z.string().min(1),
  /** Nick's voice. */
  text: z.string().min(1),
  /** Plain explanation of the mechanic. */
  rule: z.string().min(1),
  /** Profile-only conditions (validator enforces), so a page never closes on the next night. */
  when: z.array(ConditionSchema).default([]),
});
export type NotebookPage = z.infer<typeof NotebookPageSchema>;

/** Templates may use `{label_fake}` and `{label_real}` of the pair. */
export const LIFE_PLACEHOLDERS = ["label_fake", "label_real"] as const;
/** An open question of the case. Appears while `when` holds, is closed once `done` holds (both profile-only).
 *  `target` is the location the question leads to: its door (and its floor on the stairs) gets a paperclip. */
export const LeadSchema = z.object({
  id: Id,
  when: z.array(ConditionSchema).default([]),
  text: z.string().min(1),
  target: Id.optional(),
  done: z.array(ConditionSchema).min(1),
  /** One line under the struck-through lead. */
  answer: z.string().min(1),
});
export type Lead = z.infer<typeof LeadSchema>;

/** The "who vouched for me" page: `slots` lines filled with `names` in the order their qualities were first set. */
export const VouchersSchema = z.object({
  title: z.string().min(1),
  when: z.array(ConditionSchema).default([]),
  slots: z.number().int().positive(),
  empty: z.string().min(1),
  /** quality id -> the line written when it is set. */
  names: z.record(QualityIdSchema, z.string().min(1)),
  footer: z.string().min(1).optional(),
});
export type Vouchers = z.infer<typeof VouchersSchema>;

export const NotebookSchema = z.object({
  life: z.object({
    title: z.string().min(1),
    intro: z.string().min(1),
    /** fake: still on the shelf; empty: pawned, nothing came back; real: the real memory returned. */
    states: z.object({ fake: z.string().min(1), empty: z.string().min(1), real: z.string().min(1) }),
    /** Shown only while `when` holds (profile-only conditions, like pages). */
    footer: z.object({ when: z.array(ConditionSchema).default([]), text: z.string().min(1) }),
  }),
  pages: z.array(NotebookPageSchema),
  leads: z.array(LeadSchema).default([]),
  vouchers: VouchersSchema.optional(),
});
export type Notebook = z.infer<typeof NotebookSchema>;

/** Checked after every choice (after effects and onChoice); the first whose conditions
 *  hold sends the player to `goto` instead of the choice's own goto. */
export const InterruptSchema = z.object({
  when: z.array(ConditionSchema).min(1),
  goto: Id,
});
export type Interrupt = z.infer<typeof InterruptSchema>;

/** Wall clock derived from a quality: `start` + value × `step` minutes (wraps past midnight).
 *  Display only; the cost of a move still comes from `rules.onChoice`. */
export const ClockSchema = z.object({
  quality: QualityIdSchema,
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "start must be HH:MM"),
  step: z.number().int().positive(),
});
export type Clock = z.infer<typeof ClockSchema>;

/** One-off repair of a profile saved by an older version of the content. */
export const MigrationSchema = z.object({
  when: z.array(ConditionSchema).min(1),
  effects: z.array(EffectSchema).min(1),
});

export const RulesSchema = z.object({
  /** Location of the first scene of every night. */
  start: Id,
  /** Applied when a night starts, after the run bag is reset. */
  onNightStart: z.array(EffectSchema).default([]),
  /** The rumor of the very first night (the night counter is 0); later nights draw one at random. */
  firstNightRumor: Id.optional(),
  /** Checked when a night starts, all against the profile as it arrived; then the effects of every match are applied. */
  migrations: z.array(MigrationSchema).default([]),
  clock: ClockSchema.optional(),
  /** Evaluated on the report state: when all hold, the night is recorded as pawned and left out of the final story. */
  pledgedNightWhen: z.array(ConditionSchema).optional(),
  /** Applied after every non-free choice, e.g. `turn += 1`. */
  onChoice: z.array(EffectSchema).default([]),
  interrupts: z.array(InterruptSchema).default([]),
  /** Applied to profile when a night ends, e.g. `nights += 1`. */
  onNightEnd: z.array(EffectSchema).default([]),
});
export type Rules = z.infer<typeof RulesSchema>;

/** A fake memory the player can pawn and the real one that may come back in its place.
 *  Both are quality ids (profile flags); the engine treats them as opaque.
 *  On a pledge the engine also sets run flags `pledged.<id>` and, on return,
 *  `returned.<id>` and `memories_returned += 1` (see RESERVED_QUALITIES). */
export const MemoryPairSchema = z.object({
  id: Id,
  fake: QualityIdSchema,
  real: QualityIdSchema,
  label_fake: z.string().min(1),
  label_real: z.string().min(1),
  /** If all hold when the fake memory is pawned, the real flag is set to 1. */
  returnWhen: z.array(ConditionSchema).default([]),
});

/** One card of the evidence folder. `flag` is a run quality; the first time it becomes 1 the engine
 *  sets profile `found.<id> = 1`, so the folder remembers every night's finds. */
export const EvidenceItemSchema = z.object({
  id: Id,
  /** Position in the folder (not the order of discovery). */
  order: z.number().int().default(0),
  flag: QualityIdSchema,
  /** Asset id; the card shows it as a photo. */
  image: Id.optional(),
  title: z.string().min(1),
  /** Nick's note. */
  text: z.string().min(1),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export const EvidenceSchema = z.object({ items: z.array(EvidenceItemSchema) });
export type Evidence = z.infer<typeof EvidenceSchema>;

/** An ending: full-screen image, title, text, and epilogues shown when their `when` holds
 *  (they may look at `endings.*` of earlier playthroughs). */
export const EndingSchema = z.object({
  id: Id,
  title: z.string().min(1),
  image: Id,
  text: z.string().min(1),
  epilogues: z.array(ReportNoteSchema).default([]),
});
export type Ending = z.infer<typeof EndingSchema>;

export const STORY_PARTS = ["opening", "nights", "pledged_note", "litany", "ending", "epilogues"] as const;
export type StoryPartKind = (typeof STORY_PARTS)[number];
/** The final story assembled from the saved nights; `opening_slot`/`litany_slot` default to the first and last report slot. */
export const StorySchema = z.object({
  title: z.string().min(1),
  parts: z.array(z.enum(STORY_PARTS)),
  opening_slot: Id.optional(),
  litany_slot: Id.optional(),
  pledged_note: z.string().min(1),
  litany_intro: z.string().min(1),
  closing: z.string().min(1),
});
export type Story = z.infer<typeof StorySchema>;
export const EndingsSchema = z.object({ endings: z.array(EndingSchema), story: StorySchema });
export type Endings = z.infer<typeof EndingsSchema>;

/** Tonight's rumor: one is drawn when the night starts and sets the run flag `rumor.<id>`; content reacts to the flag. */
export const RumorSchema = z.object({
  id: Id,
  when: z.array(ConditionSchema).default([]),
  text: z.string().min(1),
});
export type Rumor = z.infer<typeof RumorSchema>;

/** Who speaks in the feed. `narrator`: no label, muted. `inner`: the player character's inner voice, italic. */
export const SpeakerSchema = z.object({
  label: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "color must be #rrggbb").optional(),
  style: z.enum(["narrator", "inner"]).optional(),
});
export type Speaker = z.infer<typeof SpeakerSchema>;

/** The staircase as one screen: a button per floor, drawn by the engine on a `layout: stairs` storylet. */
export const StairsSchema = z.object({
  /** Where the stairs screen lives. */
  location: Id,
  /** The quality holding the current floor. */
  quality: QualityIdSchema,
  /** floor number -> landing location. */
  floors: z.record(z.string().regex(/^\d+$/, "floor must be a number"), Id),
  /** half: ceil(|to − from| / 2) moves, at least 1. */
  cost: z.literal("half").default("half"),
  costMods: z.array(z.object({ when: z.array(ConditionSchema).default([]), add: z.number().int() })).default([]),
  /** A locked floor stays visible with `text`; any group of `open_any` holding opens it. */
  locks: z.array(z.object({ floor: z.number().int(), open_any: z.array(z.array(ConditionSchema).min(1)).min(1), text: z.string().min(1) })).default([]),
  /** Location whose storylets are encounters on the way (see `Storylet.floors`). */
  events: Id.optional(),
  /** Applied on every walk between floors. */
  onTravel: z.array(EffectSchema).default([]),
});
export type Stairs = z.infer<typeof StairsSchema>;

/** Placeholders the engine fills in `report.progress` besides qualities: leads that appeared and those closed. */
export const PROGRESS_PLACEHOLDERS = ["leads_done", "leads_total"] as const;

/** Quality ids the engine writes on its own; a world with memories (or evidence, or endings) must declare them. */
export const RESERVED_QUALITIES = {
  pledgedPrefix: "pledged.",
  returnedPrefix: "returned.",
  /** Profile flag per evidence item: `found.<id>` once its run flag has been 1. */
  foundPrefix: "found.",
  /** Profile flag per ending reached: `endings.<id>`; the only qualities a new case keeps. */
  endingPrefix: "endings.",
  /** Run flag per rumor: `rumor.<id>` for the one drawn this night. */
  rumorPrefix: "rumor.",
  /** Run flag set before the report of the night that ended with an ending. */
  endingNight: "ending_night",
  /** Run flag: a real memory came back this night (memories_returned counts the whole game). */
  returnedTonight: "returned_tonight",
  memoriesReturned: "memories_returned",
} as const;
export type MemoryPair = z.infer<typeof MemoryPairSchema>;

export const WorldSchema = z.object({
  id: Id,
  title: z.string(),
  qualities: z.array(QualityDefSchema),
  locations: z.array(LocationSchema),
  rules: RulesSchema,
  report: z.object({
    slots: z.array(z.object({ id: Id, label: z.string().optional() })).min(1),
    notes: z.array(ReportNoteSchema).default([]),
    /** Case progress under the report; texts may use PROGRESS_PLACEHOLDERS. */
    progress: z.array(ReportNoteSchema).default([]),
  }),
  memories: z.array(MemoryPairSchema).default([]),
  storylets: z.array(StoryletSchema),
  fragments: z.array(ReportFragmentSchema),
  notebook: NotebookSchema.optional(),
  evidence: EvidenceSchema.default({ items: [] }),
  endings: EndingsSchema.optional(),
  rumors: z.array(RumorSchema).default([]),
  speakers: z.record(Id, SpeakerSchema).default({}),
  stairs: StairsSchema.optional(),
  /** Morning screen: `notes` work like report.notes, evaluated on the report state (run flags still set). */
  morning: z.object({ notes: z.array(ReportNoteSchema).default([]) }).default({ notes: [] }),
});
export type World = z.infer<typeof WorldSchema>;
/** Shape accepted by `WorldSchema.parse` (defaults optional). */
export type WorldInput = z.input<typeof WorldSchema>;

