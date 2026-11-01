import { z } from "zod";

/** Quality id: `turn`, `dolly_trust`, `visited.floor2.tenant`. */
export const QUALITY_ID_RE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/;
/** Quality declaration may be a namespace: `visited.*` matches `visited.<anything>`. */
export const QUALITY_DECL_RE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*(\.\*)?$/;

export const CONDITION_RE = /^([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)*)\s*(==|!=|<=|>=|<|>)\s*(-?\d+)$/;
export const EFFECT_RE = /^([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)*)\s*(\+=|-=|=)\s*(-?\d+)$/;

/** `quality op int`, op ∈ == != < <= > >= */
export const ConditionSchema = z.string().regex(CONDITION_RE, "condition must look like `quality >= 3`");
/** `quality op int`, op ∈ += -= = */
export const EffectSchema = z.string().regex(EFFECT_RE, "effect must look like `quality += 1`");

export type Condition = z.infer<typeof ConditionSchema>;
export type Effect = z.infer<typeof EffectSchema>;

export type ConditionOp = "==" | "!=" | "<" | "<=" | ">" | ">=";
export type EffectOp = "+=" | "-=" | "=";

export interface ParsedCondition { quality: string; op: ConditionOp; value: number }
export interface ParsedEffect { quality: string; op: EffectOp; value: number }

export function parseCondition(src: string): ParsedCondition {
  const m = CONDITION_RE.exec(src);
  if (!m) throw new Error(`bad condition: ${src}`);
  return { quality: m[1]!, op: m[2] as ConditionOp, value: Number(m[3]) };
}

export function parseEffect(src: string): ParsedEffect {
  const m = EFFECT_RE.exec(src);
  if (!m) throw new Error(`bad effect: ${src}`);
  return { quality: m[1]!, op: m[2] as EffectOp, value: Number(m[3]) };
}

/** `{quality_id}` inside text and outcome strings is replaced with the quality's value. */
export const PLACEHOLDER_RE = /\{([^{}]*)\}/g;

/** Every `{...}` found in a template, valid or not (the validator decides). */
export function placeholders(template: string): string[] {
  return Array.from(template.matchAll(PLACEHOLDER_RE), (m) => m[1]!);
}

/** Does a quality id match a declaration (exact id or `prefix.*` namespace)? */
export function qualityMatches(decl: string, id: string): boolean {
  if (decl.endsWith(".*")) return id.startsWith(decl.slice(0, -1)) && id.length > decl.length - 1;
  return decl === id;
}
