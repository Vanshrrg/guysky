// Static board layout/position data (percentages of the board frame), factored
// out of Board.tsx. All read-only — calibrated by hand against the board art.

/** Per-city panic-tray positions (where the panic-level marker sits). */
export const PANIC_TRAY_POS: Record<string, { x: number; y: number }> = {
  "san-francisco":   { x: 17.36, y: 39.70 },
  "chicago":         { x: 22.26, y: 33.95 },
  "montreal":        { x: 28.66, y: 33.13 },
  "new-york":        { x: 36.62, y: 38.01 },
  "washington":      { x: 36.03, y: 42.46 },
  "atlanta":         { x: 24.98, y: 44.12 },
  "london":          { x: 47.21, y: 26.97 },
  "madrid":          { x: 44.85, y: 37.21 },
  "paris":           { x: 50.92, y: 37.56 },
  "essen":           { x: 51.64, y: 26.93 },
  "milan":           { x: 57.81, y: 33.23 },
  "st-petersburg":   { x: 62.48, y: 26.93 },
  "los-angeles":     { x: 15.61, y: 47.43 },
  "mexico-city":     { x: 22.02, y: 54.71 },
  "miami":           { x: 31.77, y: 49.24 },
  "bogota":          { x: 31.14, y: 58.49 },
  "lima":            { x: 25.57, y: 72.47 },
  "santiago":        { x: 26.59, y: 84.36 },
  "buenos-aires":    { x: 34.73, y: 84.54 },
  "sao-paulo":       { x: 40.46, y: 74.34 },
  "lagos":           { x: 49.46, y: 59.12 },
  "kinshasa":        { x: 53.93, y: 66.42 },
  "khartoum":        { x: 60.96, y: 56.50 },
  "johannesburg":    { x: 60.76, y: 75.65 },
  "algiers":         { x: 50.53, y: 45.87 },
  "cairo":           { x: 56.83, y: 45.14 },
  "istanbul":        { x: 57.58, y: 38.19 },
  "moscow":          { x: 62.51, y: 32.27 },
  "baghdad":         { x: 64.77, y: 46.78 },
  "riyadh":          { x: 64.99, y: 55.86 },
  "tehran":          { x: 70.25, y: 37.07 },
  "karachi":         { x: 67.82, y: 47.02 },
  "delhi":           { x: 76.18, y: 43.47 },
  "mumbai":          { x: 68.81, y: 55.36 },
  "chennai":         { x: 73.71, y: 60.66 },
  "kolkata":         { x: 77.43, y: 47.81 },
  "beijing":         { x: 81.43, y: 35.29 },
  "seoul":           { x: 90.38, y: 33.35 },
  "tokyo":           { x: 95.13, y: 39.78 },
  "osaka":           { x: 95.93, y: 44.59 },
  "shanghai":        { x: 81.49, y: 43.20 },
  "taipei":          { x: 89.66, y: 49.23 },
  "hong-kong":       { x: 82.38, y: 53.62 },
  "bangkok":         { x: 78.61, y: 55.57 },
  "manila":          { x: 92.61, y: 60.18 },
  "jakarta":         { x: 78.68, y: 69.63 },
  "sydney":          { x: 93.06, y: 84.53 },
};

/** The five objective-card slots across the top of the board. */
export const OBJECTIVE_SLOTS = [
  { x: 7.02,  y: 8.62, w: 11.09 },
  { x: 19.09, y: 8.51, w: 11.09 },
  { x: 31.45, y: 8.27, w: 11.09 },
  { x: 43.82, y: 8.39, w: 11.09 },
  { x: 56.04, y: 8.62, w: 11.09 },
];

/** The 9 outbreak-track marker positions (index = outbreak count). */
export const OUTBREAK_TRACK: { x: number; y: number }[] = [
  { x: 3.87, y: 41.84 }, // 0
  { x: 6.70, y: 45.22 }, // 1
  { x: 3.82, y: 48.35 }, // 2
  { x: 6.70, y: 51.66 }, // 3
  { x: 3.88, y: 54.98 }, // 4
  { x: 6.65, y: 58.02 }, // 5
  { x: 3.88, y: 60.89 }, // 6
  { x: 6.65, y: 64.11 }, // 7
  { x: 3.82, y: 67.16 }, // 8
];

/** The 7 infection-rate-track marker positions (index = infection rate step). */
export const INFECTION_TRACK: { x: number; y: number }[] = [
  { x: 72.72, y: 20.62 }, // 0
  { x: 76.07, y: 20.47 }, // 1
  { x: 79.46, y: 20.34 }, // 2
  { x: 82.83, y: 20.33 }, // 3
  { x: 86.20, y: 20.24 }, // 4
  { x: 89.63, y: 20.07 }, // 5
  { x: 93.10, y: 20.07 }, // 6
];
