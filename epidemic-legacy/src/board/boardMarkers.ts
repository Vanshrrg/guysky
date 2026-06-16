import outbreakSrc from "../../object/outbreak marker.png";
import cureSrc from "../../object/cure marker.png";
import infectionRateSrc from "../../object/infection rate marker.png";
import { type MarkerState } from "./BoardMarker";
import { LS_CURED, LS_ERADICATED } from "./boardStorage";

// The fixed board markers (outbreak counter, infection-rate counter, and the
// four cure markers). `def` is the start position; `curePos` (if present) is
// where the cure marker moves once that disease is cured.
export const MARKERS: {
  key: string; src: string; alt: string; def: MarkerState; tintColor?: string; cssFilter?: string;
  curePos?: { x: number; y: number }; fixed?: boolean;
}[] = [
  { key: "epidemic.marker.outbreak.v2",      src: outbreakSrc,      alt: "Outbreak marker",         def: { x: 3.87,  y: 41.84, w: 2.20, rot: -45 }, fixed: true },
  { key: "epidemic.marker.cure.v2",          src: cureSrc,          alt: "Cure marker",             def: { x: 8.97,  y: 96.60, w: 2.34, rot: 0 }, curePos: { x: 9.27,  y: 72.82 }, fixed: true },
  { key: "epidemic.marker.infectionrate.v2", src: infectionRateSrc, alt: "Infection rate marker",   def: { x: 72.72, y: 20.62, w: 2.79, rot: 0 }, fixed: true },
  { key: "epidemic.marker.cure-yellow.v2",   src: cureSrc,          alt: "Cure marker (yellow)",    def: { x: 3.21,  y: 96.42, w: 2.34, rot: 0 }, cssFilter: "sepia(1) hue-rotate(15deg) saturate(600%) brightness(1.3)", curePos: { x: 3.30,  y: 72.91 }, fixed: true },
  { key: "epidemic.marker.cure-darkblue.v2", src: cureSrc,          alt: "Cure marker (dark blue)", def: { x: 14.77, y: 96.73, w: 2.34, rot: 0 }, cssFilter: "hue-rotate(225deg) saturate(250%) brightness(0.45)", curePos: { x: 14.82, y: 72.73 }, fixed: true },
  { key: "epidemic.marker.cure-black.v2",    src: cureSrc,          alt: "Cure marker (black)",     def: { x: 20.55, y: 96.78, w: 2.34, rot: 0 }, cssFilter: "saturate(0%) brightness(0.18)", curePos: { x: 20.52, y: 72.82 }, fixed: true },
];

/** Indices into MARKERS that are cure markers (have a curePos). */
export const CURE_INDICES = MARKERS.map((m, i) => m.curePos ? i : -1).filter(i => i >= 0);
// Maps DiseaseColor → index in CURE_INDICES (ci)
// Order mirrors MARKERS: ci0=red(no tint), ci1=yellow, ci2=blue, ci3=black
export const COLOR_TO_CURE_IDX: Record<string, number> = { red: 0, yellow: 1, blue: 2, black: 3 };

export function loadMarker(key: string, def: MarkerState): MarkerState {
  try { const r = localStorage.getItem(key); if (r) return { rot: 0, ...JSON.parse(r) }; }
  catch { /* ignore */ }
  return def;
}

export function loadCured(): boolean[] {
  try { const r = localStorage.getItem(LS_CURED); if (r) return JSON.parse(r); }
  catch { /* ignore */ }
  return CURE_INDICES.map(() => false);
}

export function loadEradicated(): boolean[] {
  try { const r = localStorage.getItem(LS_ERADICATED); if (r) return JSON.parse(r); }
  catch { /* ignore */ }
  return CURE_INDICES.map(() => false);
}
