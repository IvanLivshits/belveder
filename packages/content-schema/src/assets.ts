import { z } from "zod";

export const AssetEntrySchema = z.object({
  src: z.string(),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});
export type AssetEntry = z.infer<typeof AssetEntrySchema>;

/** `assets/assets.json`: id -> file. Content references images by id only. */
export const AssetManifestSchema = z.record(z.string(), AssetEntrySchema);
export type AssetManifest = z.infer<typeof AssetManifestSchema>;
