/** Test-only: compares a value's canonical digest with test/golden/<name>.json.
 *  UPDATE_GOLDEN=1 bun test  rewrites the files; explain the change in the commit. */
import { expect } from "bun:test";
import { canonicalJson, digest } from "../src";

export async function expectGolden(dir: string, name: string, value: unknown): Promise<void> {
  const file = `${dir}/golden/${name}.json`;
  const actual = { digest: await digest(value), snapshot: value };
  if (process.env["UPDATE_GOLDEN"]) {
    await Bun.write(file, JSON.stringify(JSON.parse(canonicalJson(actual)), null, 2) + "\n");
    return;
  }
  const f = Bun.file(file);
  if (!(await f.exists())) throw new Error(`missing golden ${file}; run with UPDATE_GOLDEN=1`);
  const expected = (await f.json()) as { digest: string; snapshot: unknown };
  if (expected.digest !== actual.digest) {
    // Show a readable diff before failing on the hash.
    expect(actual.snapshot).toEqual(expected.snapshot);
  }
  expect(actual.digest).toBe(expected.digest);
}
