// State model for Epidemic Legacy — a direct transcription of SPEC.md Section 3.
//
// Everything here is serializable (no class instances, no functions, no DOM
// refs) because "all state is one serializable object" (SPEC §3). The whole
// tree round-trips through JSON for save/load and export/import.

/** Disease / player colors. Kept as a string union; extend in the content pass. */
export type Color = "blue" | "yellow" | "black" | "red";

/** The 11 physical piece kinds from SPEC §3. */
export type ObjectKind =
  | "pawn"
  | "diseaseCube"
  | "building"
  | "characterCard"
  | "playerCard"
  | "infectionCard"
  | "cureMarker"
  | "infectionRateMarker"
  | "outbreakMarker"
  | "fadeToken"
  | "roadBlock";

/**
 * Where a piece sits. `zone` is a logical area (a city id, a track, a deck slot,
 * a spawn area). `x`/`y` are **percentages** (0–100) within that zone so the
 * board scales (SPEC §6) — never store fixed pixels.
 */
export interface Position {
  zone: string;
  x: number;
  y: number;
}

/** Free-form per-piece state. Known fields are typed; the rest is open. */
export interface ObjectState {
  color?: Color;
  faceUp?: boolean;
  [key: string]: unknown;
}

/** A single physical piece on the table (SPEC §3 "Object"). */
export interface GameObject {
  id: string;
  kind: ObjectKind;
  position: Position;
  state: ObjectState;
}

// ---------------------------------------------------------------------------
// Layer A — The Table (one game session)
// ---------------------------------------------------------------------------

export interface Player {
  id: string;
  color: Color;
  name: string;
}

/** Track / counter markers that aren't free-floating GameObjects. */
export interface Markers {
  infectionRate: number;
  outbreaks: number;
  cures: Record<Color, boolean>;
  [key: string]: unknown;
}

/** Decks map a name ("player", "infection", "discardPlayer", …) to ids. */
export type Decks = Record<string, string[]>;

export interface TableState {
  /** 2..4 players. Always an array — never hardcode 2 (SPEC §3). */
  players: Player[];
  objects: GameObject[];
  decks: Decks;
  markers: Markers;
}

// ---------------------------------------------------------------------------
// Layer B — The Legacy / Campaign (persists across the 12 months)
// ---------------------------------------------------------------------------

export type CampaignStatus =
  | "in-progress"
  | "won-pending-advance"
  | "lost-pending-retry";

export interface Character {
  id: string;
  name: string;
  color: Color;
  lost: boolean;
  stickers: string[];
}

export interface Objective {
  id: string;
  text: string;
  active: boolean;
  completed: boolean;
}

export interface PermanentBuilding {
  type: string;
  cityId: string;
}

export interface MapSticker {
  cityId: string;
  sticker: string;
}

export interface CardSticker {
  deck: string;
  cardId: string;
  sticker: string;
}

export interface LogEntry {
  month: number;
  entries: string[];
}

/** What has been unlocked by the current month (drives spawn availability). */
export interface Unlocks {
  charactersAvailable: string[];
  buildingsAvailable: string[];
  [key: string]: unknown;
}

export interface CampaignState {
  currentMonth: number; // 1..12
  status: CampaignStatus;
  characters: Character[];
  objectives: Objective[];
  permanentBuildings: PermanentBuilding[];
  mapStickers: MapSticker[];
  cardStickers: CardSticker[];
  upgrades: string[]; // +2 permanent per finished game
  fadedCubes: number; // cubes permanently converted to fade tokens
  log: LogEntry[]; // manual per-game log
  unlocks: Unlocks;
}

// ---------------------------------------------------------------------------
// Top-level persisted blob
// ---------------------------------------------------------------------------

/** Bump when the on-disk shape changes incompatibly; load checks it. */
export const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  campaign: CampaignState;
  /** Optional autosaved session snapshot so a half-played game can resume. */
  table: TableState | null;
}
