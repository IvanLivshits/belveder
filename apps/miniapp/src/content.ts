/** Loads and validates world.json (bundled) and assets.json (served from /). */
import { AssetManifestSchema, WorldSchema, type AssetManifest, type World } from "@belvedere/content-schema";
import worldJson from "../../../content/belvedere/build/world.json";

export interface Content {
  world: World;
  assets: AssetManifest;
  /** Resolves an asset id to a URL; unknown ids fall back to an empty string. */
  src(id: string | undefined): string;
}

export async function loadContent(): Promise<Content> {
  const world = WorldSchema.parse(worldJson);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/assets.json`);
  if (!res.ok) throw new Error(`assets.json: HTTP ${res.status}`);
  const assets = AssetManifestSchema.parse(await res.json());
  return {
    world,
    assets,
    src: (id) => (id && assets[id] ? `${base}/${assets[id].src}` : ""),
  };
}
