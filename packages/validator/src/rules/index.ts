import type { AssetManifest, World } from "@belvedere/content-schema";
import { check as qualities } from "./qualities";
import { check as references } from "./references";
import { check as deadEnds } from "./dead-ends";
import { check as reachability } from "./reachability";
import { check as reportSlots } from "./report-slots";
import { check as layouts } from "./layouts";
import { check as placeholders } from "./placeholders";
import { check as memories } from "./memories";
import { check as planned } from "./planned";
import type { Issue, Rule } from "./types";

export type { Issue, Level, Rule } from "./types";

export const rules: Record<string, Rule> = {
  qualities, references, "dead-ends": deadEnds, reachability, "report-slots": reportSlots, layouts, placeholders, memories, planned,
};

export function runRules(world: World, assets: AssetManifest): Issue[] {
  return Object.values(rules).flatMap((rule) => rule(world, assets));
}
