// localStorage layer for the board: key constants, default positions, typed
// loaders, and the per-game reset. Factored out of Board.tsx.
// (MARKERS/CURE_INDICES-dependent loaders — loadCured/loadEradicated/loadMarker —
// stay in Board.tsx since they need those tables.)

export type CardState = { x: number; y: number; w: number };
export type HandCards = { p1: string[]; p2: string[]; p3: string[]; p4: string[] };
export type TurnPhase = "actions" | "draw" | "discard" | "discard-action" | "infect";
export interface TurnStateData {
  currentPlayerIndex: number;
  actionsRemaining: number;
  phase: TurnPhase;
  pendingCharter: boolean;
  pendingShuttle: boolean;
  drawCount: number;
  infectCount: number;
  /** Player key that must discard a card before actions resume (Share Knowledge over-limit) */
  discardPlayer?: string;
}

// ─── Key constants ────────────────────────────────────────────────────────
export const LS_CURED = "epidemic.cured.v2";
export const LS_CITY_INFECTION = "epidemic.cityInfection.v2"; // v2: per-color map
export const LS_ERADICATED = "epidemic.eradicated.v2";
export const LS_OUTBREAK_POS = "epidemic.outbreak-pos.v1";
export const LS_INFECTION_POS = "epidemic.infection-pos.v1";
export const LS_HAND_CARDS = "epidemic.hand-cards.v1";
export const LS_CARD_INFECTION = "epidemic.card.infection";
export const LS_CARD_PLAYER = "epidemic.card.player";
export const LS_CARD_INFECTION_DISCARD = "epidemic.card.infection-discard";
export const LS_CARD_PLAYER_DISCARD = "epidemic.card.player-discard";
export const LS_TOKEN_P1 = "epidemic.token-p1.v1";
export const LS_TOKEN_P2 = "epidemic.token-p2.v1";
export const LS_TOKEN_P3 = "epidemic.token-p3.v1";
export const LS_TOKEN_P4 = "epidemic.token-p4.v1";
export const LS_RESEARCH_STATIONS = "epidemic.research-stations.v1";
export const LS_RESEARCH_POS = "epidemic.research-pos.v1";
export const LS_RESEARCH_STICKERS = "epidemic.research-stickers.v1";
export const LS_RESEARCH_STICKERS_DESTROYED = "epidemic.research-stickers-destroyed.v1";
export const LS_RESEARCH_STICKER_POS = "epidemic.research-sticker-pos.v1";
export const LS_DESTROYED_STICKER_POS = "epidemic.destroyed-sticker-pos.v1";
export const LS_PANIC_LEVELS = "epidemic.panic-levels.v1";
export const LS_HCMC_TRAY = "epidemic.panic-tray.hcmc.v1";
export const LS_TURN = "epidemic.turn.v1";
export const LS_PLAYER_CITIES = "epidemic.player-cities.v1";
export const LS_INFECT_DECK = "epidemic.infect-deck.v1";
export const LS_INFECT_DISCARD = "epidemic.infect-discard.v1";
export const LS_PLAYER_DECK = "epidemic.player-deck.v1";
export const LS_EPIDEMIC_COUNT = "epidemic.epidemic-count.v1";
export const LS_CARD_SCHEMA = "epidemic.cardSchema";

// ─── Campaign-persistent keys (NOT in GAME_LS_KEYS) ─────────────────────────
// These survive Restart / Main Menu — like panic levels.
export const LS_CHARACTER_NAMES = "epidemic.character-names.v1";
export const LS_CODA_COLOR      = "epidemic.coda-color.v1";
export const LS_DISEASE_NAMES   = "epidemic.disease-names.v1";
// Positive mutations: per-disease-color tier level (0–4). Persistent like other upgrades.
export const LS_MUTATIONS            = "epidemic.mutations.v1";
export const LS_MUTATION_STICKER_POS = "epidemic.mutation-sticker-pos.v1";
export const LS_MUTATION_MARKER_POS  = "epidemic.mutation-marker-pos.v1";

// ─── Default positions ────────────────────────────────────────────────────
export const DEF_CARD_INFECTION: CardState = { x: 75.98, y: 9.04, w: 11.59 };
export const DEF_CARD_PLAYER: CardState = { x: 74.18, y: 89.26, w: 8.38 };
export const DEF_CARD_INFECTION_DISCARD: CardState = { x: 89.44, y: 8.55, w: 11.59 };
export const DEF_CARD_PLAYER_DISCARD: CardState = { x: 84.73, y: 89.55, w: 8.38 };
export const DEF_TOKEN_P1: CardState = { x: 51.21, y: 57.25, w: 2.42 };
export const DEF_TOKEN_P2: CardState = { x: 53.00, y: 57.25, w: 2.42 };
export const DEF_TOKEN_P3: CardState = { x: 55.00, y: 57.25, w: 2.42 };
export const DEF_TOKEN_P4: CardState = { x: 57.00, y: 57.25, w: 2.42 };
export const DEF_HCMC = { x: 85.88, y: 60.93 };
export type StickerPos = { dx: number; dy: number; w: number };
export const DEF_RESEARCH_STICKER_POS: StickerPos = { dx: 0, dy: -2.85, w: 1.27 };
// Destroyed research station — same offset as the active sticker, 20% smaller.
export const DEF_DESTROYED_STICKER_POS: StickerPos = { dx: 0, dy: -2.85, w: 1.016 };
// Positive-mutation tier-sticker stack: {x,y} = tier-1 anchor (board %), w = sticker width %.
// Tiers stack downward (1 on top → 4 at bottom) just above the disease cube tray.
export const DEF_MUTATION_STICKER_POS: CardState = { x: 11.9, y: 71, w: 3.6 };
// Per-disease colour markers: offset from each tier sticker centre; w = marker width %.
export const DEF_MUTATION_MARKER_POS: StickerPos = { dx: 2.5, dy: 0, w: 1.3 };

// ─── Card-pile-position schema reset (runs on import) ─────────────────────
// Bump this whenever any DEF_CARD_* default position changes.
const CARD_SCHEMA_V = "4";
const CARD_LS_KEYS = [LS_CARD_INFECTION, LS_CARD_PLAYER, LS_CARD_INFECTION_DISCARD, LS_CARD_PLAYER_DISCARD];
if (localStorage.getItem(LS_CARD_SCHEMA) !== CARD_SCHEMA_V) {
  CARD_LS_KEYS.forEach(k => localStorage.removeItem(k));
  localStorage.setItem(LS_CARD_SCHEMA, CARD_SCHEMA_V);
}

// ─── Loaders ──────────────────────────────────────────────────────────────
export function loadCard(key: string, def: CardState): CardState {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return def;
}
export function loadTrackPos(key: string, max: number): number {
  try { const r = localStorage.getItem(key); if (r !== null) return Math.min(max, Math.max(0, Number(r))); }
  catch { /* ignore */ }
  return 0;
}
export function loadHandCards(): HandCards {
  try { const r = localStorage.getItem(LS_HAND_CARDS); if (r) return { p1: [], p2: [], p3: [], p4: [], ...JSON.parse(r) }; } catch { /* ignore */ }
  return { p1: [], p2: [], p3: [], p4: [] };
}
export function loadResearchStations(): Set<string> {
  try { const r = localStorage.getItem(LS_RESEARCH_STATIONS); if (r) return new Set(JSON.parse(r)); } catch { /* ignore */ }
  return new Set();
}
export function loadResearchPos(): Record<string, { x: number; y: number }> {
  try { const r = localStorage.getItem(LS_RESEARCH_POS); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return {};
}
export function loadPanicLevels(): Record<string, number> {
  try { const r = localStorage.getItem(LS_PANIC_LEVELS); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return {};
}
export function loadResearchStickers(): string[] {
  try {
    const r = localStorage.getItem(LS_RESEARCH_STICKERS);
    if (r) return JSON.parse(r);
  } catch { /* ignore */ }
  // First run: seed the default baseline sticker at Atlanta.
  const def = ["atlanta"];
  localStorage.setItem(LS_RESEARCH_STICKERS, JSON.stringify(def));
  return def;
}
export function loadResearchStickersDestroyed(): string[] {
  try { const r = localStorage.getItem(LS_RESEARCH_STICKERS_DESTROYED); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return [];
}
export function loadResearchStickerPos(): StickerPos {
  try { const r = localStorage.getItem(LS_RESEARCH_STICKER_POS); if (r) return { ...DEF_RESEARCH_STICKER_POS, ...JSON.parse(r) }; } catch { /* ignore */ }
  return DEF_RESEARCH_STICKER_POS;
}
export function loadDestroyedStickerPos(): StickerPos {
  try { const r = localStorage.getItem(LS_DESTROYED_STICKER_POS); if (r) return { ...DEF_DESTROYED_STICKER_POS, ...JSON.parse(r) }; } catch { /* ignore */ }
  return DEF_DESTROYED_STICKER_POS;
}
export function loadHcmc(): { x: number; y: number } {
  try { const r = localStorage.getItem(LS_HCMC_TRAY); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return DEF_HCMC;
}
export function loadTurnState(): TurnStateData {
  try { const r = localStorage.getItem(LS_TURN); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return { currentPlayerIndex: 0, actionsRemaining: 4, phase: "actions", pendingCharter: false, pendingShuttle: false, drawCount: 0, infectCount: 0 };
}
export function loadPlayerCities(count: number): string[] {
  try { const r = localStorage.getItem(LS_PLAYER_CITIES); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return Array(count).fill("atlanta");
}
export function loadCharacterNames(): Record<string, string> {
  try { const r = localStorage.getItem(LS_CHARACTER_NAMES); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return {};
}
export function loadCodaColor(): string | null {
  try { return localStorage.getItem(LS_CODA_COLOR); } catch { /* ignore */ }
  return null;
}
export function loadDiseaseNames(): Record<string, string> {
  try { const r = localStorage.getItem(LS_DISEASE_NAMES); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return {};
}
export function loadMutations(): Record<string, number> {
  try { const r = localStorage.getItem(LS_MUTATIONS); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return {};
}
export function loadMutationStickerPos(): CardState {
  try { const r = localStorage.getItem(LS_MUTATION_STICKER_POS); if (r) return { ...DEF_MUTATION_STICKER_POS, ...JSON.parse(r) }; } catch { /* ignore */ }
  return DEF_MUTATION_STICKER_POS;
}
export function loadMutationMarkerPos(): StickerPos {
  try { const r = localStorage.getItem(LS_MUTATION_MARKER_POS); if (r) return { ...DEF_MUTATION_MARKER_POS, ...JSON.parse(r) }; } catch { /* ignore */ }
  return DEF_MUTATION_MARKER_POS;
}

// ─── Per-game reset ───────────────────────────────────────────────────────
// All per-game state keys — cleared on Restart / Main Menu so a new game starts
// fresh. Deliberately EXCLUDES calibration/layout positions (marker positions,
// card-pile positions, HCMC tray) and permanent legacy state (panic levels).
export const GAME_LS_KEYS = [
  LS_CITY_INFECTION, LS_HAND_CARDS, LS_CURED, LS_ERADICATED,
  LS_OUTBREAK_POS, LS_INFECTION_POS, LS_TURN, LS_PLAYER_CITIES,
  LS_RESEARCH_STATIONS, LS_RESEARCH_POS,
  LS_TOKEN_P1, LS_TOKEN_P2, LS_TOKEN_P3, LS_TOKEN_P4,
  LS_INFECT_DECK, LS_INFECT_DISCARD, LS_PLAYER_DECK, LS_EPIDEMIC_COUNT,
];
export function clearGameState() {
  GAME_LS_KEYS.forEach(k => localStorage.removeItem(k));
}
