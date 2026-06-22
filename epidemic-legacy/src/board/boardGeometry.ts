// Pure geometry + utility helpers shared by the board, factored out of Board.tsx.

/** Board art aspect ratio (height / width), used to convert x% spacing into y%. */
export const BOARD_RATIO = 918 / 568;

/** Cube width as a % of board width — same size for all 96 cubes. */
export const CUBE_W = 1.67;

/** Fisher–Yates shuffle; returns a new array. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Seeded PRNG for deterministic pile positions.
function pr(seed: number) { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }

/** Pile center positions (% of board) — one per color, order: black, yellow, red, blue. */
export const PILE_CENTERS = [
  { x: 20.68, y: 91.03 }, // black
  { x: 3.13,  y: 91.03 }, // yellow
  { x: 8.82,  y: 91.03 }, // red
  { x: 14.77, y: 91.03 }, // blue
];

/** Deterministic scattered positions for the 96 cube-supply markers (4 colors × 24). */
export function defaultCubes() {
  const centers = PILE_CENTERS;
  const result: { x: number; y: number }[] = [];
  for (let ci = 0; ci < 4; ci++) {
    const { x, y } = centers[ci];
    const pile = Array.from({ length: 24 }, (_, j) => {
      const idx = ci * 24 + j;
      return { x: x + (pr(idx * 2) - 0.5) * 3.2, y: y + (pr(idx * 2 + 1) - 0.5) * 4.5 };
    });
    // Sort back→front so cubes with higher y render last (on top)
    pile.sort((a, b) => a.y - b.y);
    result.push(...pile);
  }
  return result;
}

/** Returns true if (px,py) falls inside the marker's bounding box with padding. */
export function inBox(px: number, py: number, cx: number, cy: number, w: number, pad = 1.6) {
  const hw = (w / 2) * pad;
  const hh = (w * BOARD_RATIO / 2) * pad;
  return Math.abs(px - cx) <= hw && Math.abs(py - cy) <= hh;
}
