import type { AssetManifest, World } from "@belvedere/content-schema";

export type Level = "error" | "warning";
export interface Issue { level: Level; where: string; message: string }
export type Rule = (world: World, assets: AssetManifest) => Issue[];

export const error = (where: string, message: string): Issue => ({ level: "error", where, message });
export const warning = (where: string, message: string): Issue => ({ level: "warning", where, message });
