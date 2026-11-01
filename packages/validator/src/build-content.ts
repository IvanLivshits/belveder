/** bun run packages/validator/src/build-content.ts <content-dir> <out.json> */
import { loadWorldDir } from "./load";

const [dir, out] = process.argv.slice(2);
if (!dir || !out) {
  console.error("usage: build-content <content-dir> <out.json>");
  process.exit(2);
}
const world = await loadWorldDir(dir);
await Bun.write(out, JSON.stringify(world));
console.log(`built ${out}: ${world.storylets.length} storylets, ${world.fragments.length} fragments`);
