// Factories for fresh state. The campaign starts at month 1; the table is
// seeded with DUMMY objects (a few cubes, a pawn, a tiny deck) purely so
// save/load/export round-trips have something real to carry. Real content
// (48 cities, 61+48 cards, art) arrives in Prompt 5.

import {
  SAVE_VERSION,
  type CampaignState,
  type Color,
  type GameObject,
  type Player,
  type SaveData,
  type TableState,
} from "./types";

const COLORS: Color[] = ["blue", "yellow", "black", "red"];

/** A fresh month-1 campaign with no legacy changes yet. */
export function createCampaign(): CampaignState {
  return {
    currentMonth: 1,
    status: "in-progress",
    characters: [],
    objectives: [],
    permanentBuildings: [],
    mapStickers: [],
    cardStickers: [],
    upgrades: [],
    fadedCubes: 0,
    log: [],
    unlocks: {
      charactersAvailable: [],
      buildingsAvailable: ["researchStation"],
    },
  };
}

/** Default 2-player roster (players are always an array, never hardcoded to 2). */
export function defaultPlayers(count = 2): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    color: COLORS[i % COLORS.length],
    name: `Player ${i + 1}`,
  }));
}

/** A table with dummy pieces and a small dummy deck to prove persistence. */
export function createTable(players: Player[] = defaultPlayers()): TableState {
  const objects: GameObject[] = [
    {
      id: "pawn-1",
      kind: "pawn",
      position: { zone: "city-1", x: 50, y: 50 },
      state: { color: players[0]?.color ?? "blue" },
    },
    {
      id: "cube-1",
      kind: "diseaseCube",
      position: { zone: "city-1", x: 40, y: 60 },
      state: { color: "blue" },
    },
    {
      id: "cube-2",
      kind: "diseaseCube",
      position: { zone: "city-2", x: 30, y: 30 },
      state: { color: "yellow" },
    },
  ];

  // A tiny dummy player deck of face-down card objects.
  const playerCards: GameObject[] = Array.from({ length: 5 }, (_, i) => ({
    id: `pc-${i + 1}`,
    kind: "playerCard" as const,
    position: { zone: "deck-player", x: 0, y: 0 },
    state: { faceUp: false },
  }));

  return {
    players,
    objects: [...objects, ...playerCards],
    decks: {
      player: playerCards.map((c) => c.id),
      infection: [],
      discardPlayer: [],
      discardInfection: [],
    },
    markers: {
      infectionRate: 0,
      outbreaks: 0,
      cures: { blue: false, yellow: false, black: false, red: false },
    },
  };
}

/** Bundle a fresh campaign + table into a save blob. */
export function createSaveData(): SaveData {
  return {
    version: SAVE_VERSION,
    campaign: createCampaign(),
    table: createTable(),
  };
}
