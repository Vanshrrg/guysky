# Epidemic Legacy — Spec

## 1. What this is (read this first)

Epidemic Legacy is a **digital tabletop**, not a rules engine.

The computer is the **table**, not the **referee**. It holds the board and the
pieces and lets 2–4 players (hot-seat, sharing one screen) pick things up, move
them, flip them, add and remove them. It does **NOT** enforce Pandemic's rules,
check legal moves, or play the game for anyone. The players know the rules; the
app just gives them the physical objects to play with — like Tabletop Simulator.

Two consequences that shape the whole build:

- **There is almost no game logic to write.** No "is this move legal", no turn
  resolution, no win detection. The hard part of the last project (rules tangled
  with everything) does not exist here.
- **The real work is three things:** (1) a flexible *object/table state* you can
  drag and edit freely, (2) *persistence* (save / continue / reset), and (3) the
  *legacy layer* — permanent changes that carry across 12 monthly sessions.

Scope: **local hot-seat only.** No networking, no multiplayer sync.

---

## 2. The two layers

### Layer A — The Table (one game session)
The current physical state of everything on the table right now: where every
pawn, cube, building, marker, and card sits, and what state each is in.

### Layer B — The Legacy / Campaign (persists across sessions)
The permanent record that survives between the 12 months: stickers placed,
permanent buildings, gained/lost characters, unlocked objectives, upgrades,
the manual log, and which month the campaign is on.

When a month ends, Layer B is updated and saved. The next session starts a fresh
Table (Layer A) that *reflects* the current Legacy (Layer B).

---

## 3. State model (data shapes)

All state is one serializable object. Nothing important lives only in the DOM.

```
CampaignState (Layer B — persisted)
  currentMonth: 1..12
  status: "in-progress" | "won-pending-advance" | ...
  characters: [ { id, name, color, lost: bool, stickers: [...] } ]
  objectives: [ { id, text, active: bool, completed: bool } ]
  permanentBuildings: [ { type, cityId } ]
  mapStickers:  [ { cityId, sticker } ]
  cardStickers: [ { deck, cardId, sticker } ]
  upgrades: [ ... ]            // +2 permanent per finished game
  fadedCubes: int              // cubes converted to fade tokens permanently
  log: [ { month, entries: [...] } ]   // manual per-game log
  unlocks: { charactersAvailable, buildingsAvailable, ... }  // by month

TableState (Layer A — the current session)
  players: [ { id, color, name } ]      // 2..4, array, never hardcode 2
  objects: [ Object, ... ]              // every physical piece on the table
  decks:   { player: [...], infection: [...], discardPlayer: [...], ... }
  markers: { infectionRate, outbreaks, cures: {color: bool}, ... }

Object (a single physical piece)
  id, kind, position { zone, x, y }, state { color?, faceUp?, ... }
```

`kind` ∈ { pawn, diseaseCube, building, characterCard, playerCard,
infectionCard, cureMarker, infectionRateMarker, outbreakMarker, fadeToken,
roadBlock }

---

## 4. Object catalog (the components)

| Object | Count / variation | Notes |
|---|---|---|
| Disease cubes | 96 total — 24 each × 4 colors | can convert to fade token (legacy) |
| Buildings | 3 types × 6 each = 18 | research station, barrack, vaccine factory |
| Character cards | several | a player picks one; can be lost/removed permanently |
| Player cards | 61, shared back | drawn/played/discarded |
| Infection cards | 48, shared back | separate deck + discard |
| Pawns | one color per player | 2–4 in play |
| Cure markers | 4 (one per color) | toggled on cure |
| Infection rate marker | 1 | moves along a track |
| Outbreak marker | 1 | moves along a track; loss if maxed |
| Fade token | created from a cube (legacy) | permanent conversion |
| Road blocks | spawnable | placed on routes |

Some objects **unlock as months progress** — they shouldn't all be available in
month 1. Availability is driven by `CampaignState.unlocks` / month number.

---

## 5. Interaction model

- Players manipulate pieces by **both drag-and-drop and click/right-click menu**.
- **Drag** = move an object between valid positions/zones.
- **Click / right-click menu** on an object or zone = actions like: add cube,
  remove cube, flip card, draw, place building, spawn road block, delete.
- **Spawning:** some pieces can be spawned freely **within a designated area**.
  There are rules about **what can spawn where and during which month** — these
  are enforced *softly* (the app restricts spawn zones / month availability), but
  the app does not police general play.
- Nothing is auto-resolved; players move pieces themselves.

---

## 6. The board / map

- 48 cities connected by routes.
- Per-city the board can hold: disease cubes, buildings, pawns, road blocks (on
  routes), markers, and **stickers** (legacy).
- **Map data (city positions + route connections) is a separate data file.**
  We will stub 48 cities now and drop in real coordinates/routes later.
- All positions stored as **percentages**, not fixed pixels (so it scales).
- Layout/coordinates live in a **config file**, not hardcoded in UI code.

---

## 7. Legacy system (the heart of it)

Permanent changes that occur across the 12 months and must be saved:

- New characters become available; some characters are **lost and removed**.
- New building types / permanent buildings fixed onto the map.
- New objectives added; some objectives **removed**; some completed.
- One disease cube can become a **fade token** (permanent conversion).
- **Stickers** placed on map cities — carry to next game.
- **Stickers** placed on cards — carry to next game.
- **+2 permanent upgrades** chosen after each finished game.
- A **manual log** per game (free-text entries the players write).

All of the above live in `CampaignState` (Layer B) and are written on save.

---

## 8. Save / Continue / Reset

- **Save:** persists `CampaignState` (legacy + month + log + upgrades).
  Recommended: also autosave a `TableState` snapshot so a half-played session can
  resume (optional but strongly advised — TS-style games are long).
- **Continue / Load:** load the saved state and **begin the next game** —
  - if last game was a **win** → advance to the **next month**,
  - if last game was a **loss** → replay the **same month**.
  The new Table is built from current Legacy + that month's setup/unlocks.
- **Reset:** wipe everything and start over from **month 1**.

Persistence target: start with `localStorage` (single device, no backend needed).
Optionally allow export/import of a save file (JSON) for backup/sharing.

---

## 9. The 12-month progression

- 12 chapters ("months"). Win a month → advance; lose → retry same month.
- Each month may unlock new objects/rules and may trigger legacy changes.
- Month-specific setup (which objects available, spawn rules, objectives) is
  **data**, ideally one config entry per month, so months can be authored without
  touching engine code.

---

## 10. What's deferred (plug in later, doesn't block building)

- Real 48-city coordinates + route connections (stub now).
- Exact card text and per-card data for the 61 player / 48 infection cards.
- Art / asset files (board image, card faces, piece icons).
- Exact per-month setup tables and which legacy events fire when.

---

## 11. Build order (how to implement)

Because there's no rules engine, the phases are:

1. **State model** — define `CampaignState` + `TableState` shapes (this doc) and
   a tiny set of generic table actions: moveObject, addObject, removeObject,
   updateObjectState (flip/recolor), drawFromDeck, shuffleDeck (seedable).
2. **Persistence** — save / load / reset against `localStorage`; export/import
   JSON. Get this working *early*, with dummy state, before the UI is fancy.
3. **Board + objects UI** — render the map from the coordinates config; render
   objects from `TableState`; drag-and-drop + click/right-click menus.
4. **Spawn rules & zones** — restrict what spawns where / which month.
5. **Legacy layer** — apply permanent changes to `CampaignState`; stickers,
   lost characters, upgrades, manual log UI.
6. **Month flow** — start screen (new campaign / continue / reset), 2–4 player
   setup, end-of-game → win advances month / loss retries, +2 upgrades step.
7. **Content pass** — drop in real map data, cards, art, per-month configs.

Keep all piece/board positions as **data (percentages) in a config file**, keep
**Table state and Legacy state as separate serializable objects**, and build
**persistence before polish**.
