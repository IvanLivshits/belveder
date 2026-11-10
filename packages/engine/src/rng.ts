/** mulberry32: tiny seedable PRNG. State is a uint32 kept inside game state. */

export type RngState = number;

export function seedRng(seed: number): RngState {
  return seed >>> 0;
}

/** Returns a float in [0, 1) and the next RNG state. */
export function nextFloat(state: RngState): [value: number, next: RngState] {
  const a = (state + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, a];
}

/** Integer in [0, n). */
export function nextInt(state: RngState, n: number): [value: number, next: RngState] {
  const [f, next] = nextFloat(state);
  return [Math.floor(f * n), next];
}
