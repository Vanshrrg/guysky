// Seedable deterministic PRNG so shuffleDeck (SPEC §11.1) is reproducible:
// same seed → same shuffle. Useful for tests now and replay/sync later.

/** Hash an arbitrary string/number seed into a 32-bit integer. */
function hashSeed(seed: number | string): number {
  if (typeof seed === "number") return seed >>> 0;
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * mulberry32 — a tiny, fast PRNG. Returns a function producing floats in
 * [0, 1). Deterministic for a given seed.
 */
export function makeRng(seed: number | string): () => number {
  let a = hashSeed(seed);
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
