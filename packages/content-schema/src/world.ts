import { z } from "zod";
import { ConditionSchema, EffectSchema, QUALITY_DECL_RE, QUALITY_ID_RE } from "./expressions";

const Id = z.string().regex(/^[a-z][a-z0-9_]*$/, "id must be snake_case");

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

export const LocationSchema = z.object({ id: Id, label: z.string().optional() });
export type Location = z.infer<typeof LocationSchema>;

export const ChoiceSchema = z.object({
  text: z.string().min(1),
  when: z.array(ConditionSchema).default([]),
  effects: z.array(EffectSchema).default([]),
  goto: Id.optional(),
  /** Ends the night right after effects. */
  endNight: z.boolean().default(false),
  /** Skip `rules.onChoice` (e.g. does not cost a turn). */
  free: z.boolean().default(false),
});
export type Choice = z.infer<typeof ChoiceSchema>;

export const LayoutSchema = z.enum(["scene", "doors"]);
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

export const RulesSchema = z.object({
  /** Location of the first scene of every night. */
  start: Id,
  /** Applied after every non-free choice, e.g. `turn += 1`. */
  onChoice: z.array(EffectSchema).default([]),
  /** All must hold; checked after every choice. */
  nightEndWhen: z.array(ConditionSchema).default([]),
  /** Applied to profile when a night ends, e.g. `nights += 1`. */
  onNightEnd: z.array(EffectSchema).default([]),
});
export type Rules = z.infer<typeof RulesSchema>;

export const WorldSchema = z.object({
  id: Id,
  title: z.string(),
  qualities: z.array(QualityDefSchema),
  locations: z.array(LocationSchema),
  rules: RulesSchema,
  report: z.object({ slots: z.array(Id).min(1) }),
  storylets: z.array(StoryletSchema),
  fragments: z.array(ReportFragmentSchema),
});
export type World = z.infer<typeof WorldSchema>;
/** Shape accepted by `WorldSchema.parse` (defaults optional). */
export type WorldInput = z.input<typeof WorldSchema>;

export const QualityIdSchema = z.string().regex(QUALITY_ID_RE);
