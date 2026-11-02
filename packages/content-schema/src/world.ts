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
});
export type QualityDef = z.infer<typeof QualityDefSchema>;

/** `outdoor` switches on weather overlays (rain, lightning) in the UI; indoors stay still. */
export const LocationSchema = z.object({ id: Id, label: z.string().optional(), outdoor: z.boolean().default(false) });
export type Location = z.infer<typeof LocationSchema>;

export const ChoiceSchema = z.object({
  text: z.string().min(1),
  when: z.array(ConditionSchema).default([]),
  effects: z.array(EffectSchema).default([]),
  goto: Id.optional(),
  /** Shown on its own screen after effects are applied, before goto/endNight. */
  outcome: z.string().min(1).optional(),
  /** Ends the night right after effects. */
  endNight: z.boolean().default(false),
  /** Skip `rules.onChoice` (e.g. does not cost a turn). */
  free: z.boolean().default(false),
});
export type Choice = z.infer<typeof ChoiceSchema>;

/** scene: text + choices. doors: three doors. pledge: pick a false memory to pawn, or a plain choice. */
export const LayoutSchema = z.enum(["scene", "doors", "pledge"]);
export type Layout = z.infer<typeof LayoutSchema>;

export const StoryletSchema = z.object({
  id: Id,
  location: Id,
  priority: z.number().int().default(0),
  when: z.array(ConditionSchema).default([]),
  layout: LayoutSchema.default("scene"),
  background: Id,
  portrait: Id.optional(),
  title: z.string().optional(),
  text: z.string().min(1),
  choices: z.array(ChoiceSchema).min(1),
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

/** Checked after every choice (after effects and onChoice); the first whose conditions
 *  hold sends the player to `goto` instead of the choice's own goto. */
export const InterruptSchema = z.object({
  when: z.array(ConditionSchema).min(1),
  goto: Id,
});
export type Interrupt = z.infer<typeof InterruptSchema>;

export const RulesSchema = z.object({
  /** Location of the first scene of every night. */
  start: Id,
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

/** Quality ids the engine writes on its own; a world with memories must declare them. */
export const RESERVED_QUALITIES = {
  pledgedPrefix: "pledged.",
  returnedPrefix: "returned.",
  memoriesReturned: "memories_returned",
} as const;
export type MemoryPair = z.infer<typeof MemoryPairSchema>;

export const WorldSchema = z.object({
  id: Id,
  title: z.string(),
  qualities: z.array(QualityDefSchema),
  locations: z.array(LocationSchema),
  rules: RulesSchema,
  report: z.object({ slots: z.array(z.object({ id: Id, label: z.string().optional() })).min(1) }),
  memories: z.array(MemoryPairSchema).default([]),
  storylets: z.array(StoryletSchema),
  fragments: z.array(ReportFragmentSchema),
});
export type World = z.infer<typeof WorldSchema>;
/** Shape accepted by `WorldSchema.parse` (defaults optional). */
export type WorldInput = z.input<typeof WorldSchema>;

