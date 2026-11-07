/** Loads a content folder (world.yaml + storylets/*.yaml + report-fragments/*.yaml + optional notebook.yaml, evidence.yaml, endings.yaml and rumors.yaml)
 *  into a validated World. Used by the build script, the CLI and tests. */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { WorldSchema, type World, type WorldInput } from "@belvedere/content-schema";

async function readYaml(path: string): Promise<unknown> {
  return Bun.YAML.parse(await Bun.file(path).text());
}

async function readList(dir: string): Promise<unknown[]> {
  const files = readdirSync(dir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")).sort();
  const out: unknown[] = [];
  for (const f of files) {
    const data = await readYaml(join(dir, f));
    if (!Array.isArray(data)) throw new Error(`${join(dir, f)}: expected a YAML list`);
    out.push(...data);
  }
  return out;
}

export async function loadWorldDir(dir: string): Promise<World> {
  const base = (await readYaml(join(dir, "world.yaml"))) as Record<string, unknown>;
  const notebookPath = join(dir, "notebook.yaml");
  const evidencePath = join(dir, "evidence.yaml");
  const endingsPath = join(dir, "endings.yaml");
  const rumorsPath = join(dir, "rumors.yaml");
  const input = {
    ...base,
    storylets: await readList(join(dir, "storylets")),
    fragments: await readList(join(dir, "report-fragments")),
    ...(existsSync(notebookPath) ? { notebook: await readYaml(notebookPath) } : {}),
    ...(existsSync(evidencePath) ? { evidence: await readYaml(evidencePath) } : {}),
    ...(existsSync(endingsPath) ? { endings: await readYaml(endingsPath) } : {}),
    ...(existsSync(rumorsPath) ? { rumors: ((await readYaml(rumorsPath)) as { rumors?: unknown }).rumors } : {}),
  } as WorldInput;
  const parsed = WorldSchema.safeParse(input);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
    throw new Error(`content schema errors in ${dir}:\n${lines.join("\n")}`);
  }
  return parsed.data;
}

export async function loadWorldJson(path: string): Promise<World> {
  return WorldSchema.parse(await Bun.file(path).json());
}
