import { parseCondition, type World } from "@belvedere/content-schema";
import { getQuality } from "./qualities";
import type { GameState } from "./state";

export type Bags = Pick<GameState, "run" | "profile">;

export function evaluate(state: Bags, world: World, condition: string): boolean {
  const { quality, op, value } = parseCondition(condition);
  const actual = getQuality(state, world, quality);
  switch (op) {
    case "==": return actual === value;
    case "!=": return actual !== value;
    case "<": return actual < value;
    case "<=": return actual <= value;
    case ">": return actual > value;
    case ">=": return actual >= value;
  }
}

/** All conditions must hold (AND). Empty list is true. */
export function evaluateAll(state: Bags, world: World, conditions: readonly string[]): boolean {
  return conditions.every((c) => evaluate(state, world, c));
}
