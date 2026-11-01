/** bun run packages/validator/src/cli.ts <world.json> <assets.json> [--nights N] [--seed S]
 *  Exit 1 on any error-level issue, stuck state or simulation error. */
import { AssetManifestSchema } from "@belvedere/content-schema";
import { loadWorldJson } from "./load";
import { runRules } from "./rules";
import { formatSimulation, simulate } from "./simulate";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const flag = (name: string, def: number) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const [worldPath, assetsPath] = positional;
if (!worldPath || !assetsPath) {
  console.error("usage: cli <world.json> <assets.json> [--nights N] [--seed S]");
  process.exit(2);
}

const world = await loadWorldJson(worldPath);
const assets = AssetManifestSchema.parse(await Bun.file(assetsPath).json());

const issues = runRules(world, assets);
for (const i of issues) console.log(`${i.level === "error" ? "ERROR" : "warn "} ${i.where}: ${i.message}`);
const errors = issues.filter((i) => i.level === "error").length;
console.log(`${world.storylets.length} storylets, ${world.fragments.length} fragments: ${errors} errors, ${issues.length - errors} warnings`);

const sim = simulate(world, { nights: flag("nights", 200), seed: flag("seed", 1) });
console.log(formatSimulation(sim));

process.exit(errors > 0 || sim.stuck.length > 0 || sim.errors.length > 0 ? 1 : 0);
