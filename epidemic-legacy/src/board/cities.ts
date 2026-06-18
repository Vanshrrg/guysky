// Map data (SPEC §6): the 48 cities — colour, connections, and board position.
//
// Positions are PERCENTAGES (0–100) of the board frame so everything scales.
// They are a first-pass calibration eyeballed against the board art and meant to
// be nudged; connections + colours are the canonical Pandemic graph.
//
// Connections are stored once per city by neighbour id. The graph is symmetric;
// edge rendering de-dupes by drawing each pair only from the lower id.

import type { Color } from "../state/types";

export interface City {
  id: string;
  name: string;
  color: Color;
  /** Board position as percentages of the frame (x: left→right, y: top→bottom). */
  pos: { x: number; y: number };
  /** Neighbour city ids. */
  neighbors: string[];
}

// id helper convention: lowercase, spaces→dashes, drop accents/dots.
//   "São Paulo" → "sao-paulo", "St. Petersburg" → "st-petersburg"

export const CITIES: City[] = [
  // ---- Blue ----
  { id: "san-francisco", name: "San Francisco", color: "blue", pos: { x: 15.9, y: 38.8 }, neighbors: ["chicago", "los-angeles", "tokyo", "manila"] },
  { id: "chicago", name: "Chicago", color: "blue", pos: { x: 24, y: 34.7 }, neighbors: ["san-francisco", "los-angeles", "mexico-city", "atlanta", "montreal"] },
  { id: "montreal", name: "Montreal", color: "blue", pos: { x: 30.4, y: 34.7 }, neighbors: ["chicago", "new-york", "washington"] },
  { id: "new-york", name: "New York", color: "blue", pos: { x: 35.3, y: 35.7 }, neighbors: ["montreal", "washington", "london", "madrid"] },
  { id: "washington", name: "Washington", color: "blue", pos: { x: 34.2, y: 41.8 }, neighbors: ["atlanta", "montreal", "new-york", "miami"] },
  { id: "atlanta", name: "Atlanta", color: "blue", pos: { x: 26.5, y: 42.4 }, neighbors: ["chicago", "washington", "miami"] },
  { id: "london", name: "London", color: "blue", pos: { x: 47.2, y: 29.6 }, neighbors: ["new-york", "madrid", "paris", "essen"] },
  { id: "madrid", name: "Madrid", color: "blue", pos: { x: 46.3, y: 39.6 }, neighbors: ["new-york", "london", "paris", "sao-paulo", "algiers"] },
  { id: "paris", name: "Paris", color: "blue", pos: { x: 52, y: 34.9 }, neighbors: ["london", "madrid", "essen", "milan", "algiers"] },
  { id: "essen", name: "Essen", color: "blue", pos: { x: 53.6, y: 27.8 }, neighbors: ["london", "paris", "milan", "st-petersburg"] },
  { id: "milan", name: "Milan", color: "blue", pos: { x: 56.2, y: 32.8 }, neighbors: ["essen", "paris", "istanbul"] },
  { id: "st-petersburg", name: "St. Petersburg", color: "blue", pos: { x: 60.8, y: 25.8 }, neighbors: ["essen", "istanbul", "moscow"] },

  // ---- Yellow ----
  { id: "los-angeles", name: "Los Angeles", color: "yellow", pos: { x: 17.2, y: 49 }, neighbors: ["san-francisco", "chicago", "mexico-city", "sydney", "lima"] },
  { id: "mexico-city", name: "Mexico City", color: "yellow", pos: { x: 23.1, y: 52.4 }, neighbors: ["los-angeles", "chicago", "miami", "bogota", "lima"] },
  { id: "miami", name: "Miami", color: "yellow", pos: { x: 29.8, y: 48.7 }, neighbors: ["atlanta", "washington", "mexico-city", "bogota"] },
  { id: "bogota", name: "Bogotá", color: "yellow", pos: { x: 29.9, y: 61 }, neighbors: ["mexico-city", "miami", "lima", "buenos-aires", "sao-paulo"] },
  { id: "lima", name: "Lima", color: "yellow", pos: { x: 27.6, y: 72.4 }, neighbors: ["mexico-city", "bogota", "santiago", "los-angeles"] },
  { id: "santiago", name: "Santiago", color: "yellow", pos: { x: 28.4, y: 83.7 }, neighbors: ["lima", "buenos-aires"] },
  { id: "buenos-aires", name: "Buenos Aires", color: "yellow", pos: { x: 35.3, y: 82 }, neighbors: ["bogota", "sao-paulo", "santiago", "johannesburg"] },
  { id: "sao-paulo", name: "São Paulo", color: "yellow", pos: { x: 39, y: 73.8 }, neighbors: ["bogota", "buenos-aires", "madrid", "lagos"] },
  { id: "lagos", name: "Lagos", color: "yellow", pos: { x: 51.2, y: 59.4 }, neighbors: ["sao-paulo", "khartoum", "kinshasa"] },
  { id: "kinshasa", name: "Kinshasa", color: "yellow", pos: { x: 55.6, y: 66.7 }, neighbors: ["lagos", "khartoum", "johannesburg"] },
  { id: "khartoum", name: "Khartoum", color: "yellow", pos: { x: 59.5, y: 57.6 }, neighbors: ["lagos", "kinshasa", "johannesburg", "cairo"] },
  { id: "johannesburg", name: "Johannesburg", color: "yellow", pos: { x: 59.3, y: 77.1 }, neighbors: ["kinshasa", "khartoum", "buenos-aires"] },

  // ---- Black ----
  { id: "algiers", name: "Algiers", color: "black", pos: { x: 52.7, y: 45.8 }, neighbors: ["madrid", "paris", "istanbul", "cairo"] },
  { id: "cairo", name: "Cairo", color: "black", pos: { x: 58.2, y: 47.3 }, neighbors: ["algiers", "istanbul", "baghdad", "riyadh", "khartoum"] },
  { id: "istanbul", name: "Istanbul", color: "black", pos: { x: 59.1, y: 38.7 }, neighbors: ["milan", "st-petersburg", "moscow", "baghdad", "cairo", "algiers"] },
  { id: "moscow", name: "Moscow", color: "black", pos: { x: 64.1, y: 32.9 }, neighbors: ["st-petersburg", "istanbul", "tehran"] },
  { id: "baghdad", name: "Baghdad", color: "black", pos: { x: 63.6, y: 44 }, neighbors: ["istanbul", "cairo", "riyadh", "karachi", "tehran"] },
  { id: "riyadh", name: "Riyadh", color: "black", pos: { x: 64.4, y: 53.2 }, neighbors: ["cairo", "baghdad", "karachi"] },
  { id: "tehran", name: "Tehran", color: "black", pos: { x: 68.5, y: 37.7 }, neighbors: ["moscow", "baghdad", "karachi", "delhi"] },
  { id: "karachi", name: "Karachi", color: "black", pos: { x: 69.7, y: 47.3 }, neighbors: ["riyadh", "baghdad", "tehran", "delhi", "mumbai"] },
  { id: "delhi", name: "Delhi", color: "black", pos: { x: 74.5, y: 44.1 }, neighbors: ["tehran", "karachi", "mumbai", "chennai", "kolkata"] },
  { id: "mumbai", name: "Mumbai", color: "black", pos: { x: 70.4, y: 54.7 }, neighbors: ["karachi", "delhi", "chennai"] },
  { id: "chennai", name: "Chennai", color: "black", pos: { x: 75.3, y: 60 }, neighbors: ["mumbai", "delhi", "kolkata", "jakarta"] },
  { id: "kolkata", name: "Kolkata", color: "black", pos: { x: 79.1, y: 46.8 }, neighbors: ["delhi", "chennai", "bangkok", "hong-kong"] },

  // ---- Red ----
  { id: "beijing", name: "Beijing", color: "red", pos: { x: 83.1, y: 35.1 }, neighbors: ["shanghai", "seoul"] },
  { id: "seoul", name: "Seoul", color: "red", pos: { x: 88.7, y: 34.1 }, neighbors: ["beijing", "shanghai", "tokyo"] },
  { id: "tokyo", name: "Tokyo", color: "red", pos: { x: 93.6, y: 38.3 }, neighbors: ["seoul", "shanghai", "osaka", "san-francisco"] },
  { id: "osaka", name: "Osaka", color: "red", pos: { x: 94.4, y: 46.4 }, neighbors: ["tokyo", "taipei"] },
  { id: "shanghai", name: "Shanghai", color: "red", pos: { x: 83.3, y: 42.3 }, neighbors: ["beijing", "seoul", "tokyo", "taipei", "hong-kong"] },
  { id: "taipei", name: "Taipei", color: "red", pos: { x: 90.6, y: 46.8 }, neighbors: ["osaka", "shanghai", "hong-kong", "manila"] },
  { id: "hong-kong", name: "Hong Kong", color: "red", pos: { x: 83.9, y: 51.9 }, neighbors: ["shanghai", "taipei", "manila", "ho-chi-minh-city", "bangkok", "kolkata"] },
  { id: "bangkok", name: "Bangkok", color: "red", pos: { x: 80.2, y: 55.5 }, neighbors: ["kolkata", "hong-kong", "ho-chi-minh-city", "jakarta"] },
  { id: "ho-chi-minh-city", name: "Ho Chi Minh City", color: "red", pos: { x: 84.2, y: 62.5 }, neighbors: ["bangkok", "hong-kong", "manila", "jakarta"] },
  { id: "manila", name: "Manila", color: "red", pos: { x: 91, y: 62.1 }, neighbors: ["san-francisco", "taipei", "hong-kong", "ho-chi-minh-city", "sydney"] },
  { id: "jakarta", name: "Jakarta", color: "red", pos: { x: 80.2, y: 69.2 }, neighbors: ["chennai", "bangkok", "ho-chi-minh-city", "sydney"] },
  { id: "sydney", name: "Sydney", color: "red", pos: { x: 94.8, y: 83.4 }, neighbors: ["jakarta", "manila", "los-angeles"] },
];

/**
 * Trans-Pacific routes, drawn as two half-length stubs that run off the board
 * edges (like the white lines on the board art). `a` is the western city whose
 * stub ends at `left`; `b` is the eastern city whose stub ends at `right`.
 * Endpoints are percentages of the board frame, calibrated by hand.
 */
export interface WrapRoute {
  a: string;
  b: string;
  left: { x: number; y: number };
  right: { x: number; y: number };
}

export const WRAP_ROUTES: WrapRoute[] = [
  { a: "san-francisco", b: "tokyo", left: { x: 9, y: 38.4 }, right: { x: 99.6, y: 38.3 } },
  { a: "san-francisco", b: "manila", left: { x: 8.8, y: 41.4 }, right: { x: 99.6, y: 60 } },
  { a: "los-angeles", b: "sydney", left: { x: 9, y: 56.7 }, right: { x: 99.6, y: 80.8 } },
];

/** Pair-keys of wrap routes, so straight-line rendering can skip them. */
export const WRAP_PAIR_KEYS = new Set(
  WRAP_ROUTES.map((w) => [w.a, w.b].sort().join("|"))
);

/** Fill color per disease colour for dots/labels. */
export const COLOR_HEX: Record<Color, string> = {
  blue:   "#000569",
  yellow: "#E3BB00",
  black:  "#8a9aaa",
  red:    "#FFB4A6",
};

const byId = new Map(CITIES.map((c) => [c.id, c]));
export const cityById = (id: string): City | undefined => byId.get(id);

/** Unique undirected edges (drawn once, from the lexicographically lower id). */
export const EDGES: Array<[City, City]> = (() => {
  const out: Array<[City, City]> = [];
  for (const c of CITIES) {
    for (const nId of c.neighbors) {
      if (c.id < nId) {
        const n = byId.get(nId);
        if (n) out.push([c, n]);
      }
    }
  }
  return out;
})();
