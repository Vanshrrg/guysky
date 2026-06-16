import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import boardArt from "../../object/newupdatedboard.png";
import blackVirusSrc  from "../../object/black.png";
import blueVirusSrc   from "../../object/blue.png";
import redVirusSrc    from "../../object/red.png";
import yellowVirusSrc from "../../object/yellow.png";
import infectionCardBackSrc from "../../object/infectioncardback.png";
import playerCardBackSrc from "../../object/playercard back.png";
import epidemicCardSrc from "../../object/epidemic.png";
import objectiveSrc from "../../object/objective1.png";
import objectiveUpdatedSrc  from "../../object/Jan/objective1update.png";
import janWinBonusSrc       from "../../object/Jan/winbonus.png";
import janEndgameSrc        from "../../object/Jan/end game upgrade.png";
import janDiseaseStickerSrc from "../../object/Jan/disease sticker.png";
import researchSrc from "../../object/research.png";
import panicLevel1Src from "../../object/paniclevel1.png";
import panicLevel2Src from "../../object/paniclevel2.png";
import panicLevel3Src from "../../object/paniclevel3.png";
import panicLevel4Src from "../../object/paniclevel4.png";
import panicLevel5Src from "../../object/paniclevel5.png";
const PANIC_LEVEL_SRCS = ["", panicLevel1Src, panicLevel2Src, panicLevel3Src, panicLevel4Src, panicLevel5Src];
import { CityLayer, loadRoadblocks, saveRoadblocks, type RoadblockState } from "./CityLayer";
import { BoardMarker, CubeSvg, type MarkerState } from "./BoardMarker";
import { CITIES } from "./cities";
import { InfectionCard } from "./InfectionCard";
import { PlayerCard } from "./PlayerCard";
import { CardFlip } from "./CardFlip";
import { FlyFlipCard } from "./FlyFlipCard";
import { ShuffleAnimation } from "./ShuffleAnimation";
import medicSrc from "../../object/medic.png";
import scientistSrc from "../../object/scientist.png";
import researcherSrc from "../../object/researcher.png";
import generalistSrc from "../../object/generalist.png";
import dispatcherSrc from "../../object/dispatcher.png";
import fund1Src from "../../object/onequietnight.png";
import fund2Src from "../../object/remotetreatment.png";
import fund3Src from "../../object/govermentgrant.png";
import fund4Src from "../../object/resilientpopulation.png";
import fund5Src from "../../object/forecast.png";
import fund6Src from "../../object/airlift.png";
import fund7Src from "../../object/borrowedtime.png";
import fund8Src from "../../object/flexibleaid.png";
import diseaseCubeBlackSrc  from "../../object/diseasecubeblack.png";
import diseaseCubeBlueSrc   from "../../object/diseasecubeblue.png";
import diseaseCubeRedSrc    from "../../object/diseasecubered.png";
import diseaseCubeYellowSrc from "../../object/diseasecubeyellow.png";
import type { PreGameSetup } from "./PreGamePhase";
import { BOARD_RATIO, CUBE_W, shuffle, defaultCubes, inBox } from "./boardGeometry";
import { PANIC_TRAY_POS, OBJECTIVE_SLOTS, OUTBREAK_TRACK, INFECTION_TRACK } from "./boardLayout";
import {
  type CardState, type HandCards, type TurnStateData,
  LS_CURED, LS_CITY_INFECTION, LS_ERADICATED, LS_OUTBREAK_POS, LS_INFECTION_POS,
  LS_HAND_CARDS, LS_CARD_INFECTION, LS_CARD_PLAYER, LS_CARD_INFECTION_DISCARD,
  LS_CARD_PLAYER_DISCARD, LS_TOKEN_P1, LS_TOKEN_P2, LS_TOKEN_P3, LS_TOKEN_P4,
  LS_RESEARCH_STATIONS, LS_RESEARCH_POS, LS_PANIC_LEVELS, LS_HCMC_TRAY,
  LS_TURN, LS_PLAYER_CITIES, LS_INFECT_DECK, LS_INFECT_DISCARD, LS_PLAYER_DECK, LS_EPIDEMIC_COUNT,
  LS_CODA_COLOR, LS_DISEASE_NAMES,
  DEF_CARD_INFECTION, DEF_CARD_PLAYER, DEF_CARD_INFECTION_DISCARD, DEF_CARD_PLAYER_DISCARD,
  DEF_TOKEN_P1, DEF_TOKEN_P2, DEF_TOKEN_P3, DEF_TOKEN_P4,
  loadCard, loadTrackPos, loadHandCards, loadResearchStations, loadResearchPos,
  loadPanicLevels, loadHcmc, loadTurnState, loadPlayerCities, loadCodaColor, loadDiseaseNames, clearGameState,
} from "./boardStorage";
import { MARKERS, CURE_INDICES, COLOR_TO_CURE_IDX, loadMarker, loadCured, loadEradicated } from "./boardMarkers";
import { GameOverOverlay } from "./GameOverOverlay";
import { CodaPopup } from "./CodaPopup";
import { DiseaseNamePopup } from "./DiseaseNamePopup";
import { InfectionDiscardPopup } from "./InfectionDiscardPopup";
import { ForecastPopup } from "./ForecastPopup";
import { ContextMenu, MenuItem } from "./ContextMenu";
import { TurnPanel } from "./TurnPanel";
import { makePlayerDeckDraw, makeHandCardPointerDown } from "./handInteractions";

const COLOR_TO_CUBE: Record<string, string> = {
  blue: "#0A00A1", yellow: "#FFFA73", black: "#1a1a1a", red: "#cc1111",
};
const COLOR_TO_CUBE_IMG: Record<string, string> = {
  black: diseaseCubeBlackSrc, blue: diseaseCubeBlueSrc, red: diseaseCubeRedSrc, yellow: diseaseCubeYellowSrc,
};
const DISEASE_COLORS = ["black", "yellow", "red", "blue"] as const;
type DiseaseColor = typeof DISEASE_COLORS[number];
type CityColorCounts = Partial<Record<DiseaseColor, number>>;
type CityInfectionMap = Record<string, CityColorCounts>;

// 2×2 layout: P1 top-left, P3 bottom-left, P2 top-right, P4 bottom-right
const HAND_P1 = { x: -4.56,  y: 27, w: 9.37, h: 50 };
const HAND_P2 = { x: 104.67, y: 27, w: 9.45, h: 50 };
const HAND_P3 = { x: -4.56,  y: 76, w: 9.37, h: 50 };
const HAND_P4 = { x: 104.67, y: 76, w: 9.45, h: 50 };
const PANIC_W = 1.49;
const RESEARCH_W = 2.19;
const ROLE_IMGS: Record<string, string> = {
  medic: medicSrc, scientist: scientistSrc, researcher: researcherSrc,
  generalist: generalistSrc, dispatcher: dispatcherSrc,
};
const FUND_IMGS: Record<string, string> = {
  fund1: fund1Src, fund2: fund2Src, fund3: fund3Src, fund4: fund4Src,
  fund5: fund5Src, fund6: fund6Src, fund7: fund7Src, fund8: fund8Src,
};

const INFECTION_RATE_VALUES = [2, 2, 2, 3, 3, 4, 4];

// Precomputed at module load — deterministic scattered pile positions per color.
// Order: black, yellow, red, blue (matches DISEASE_COLORS / placedPerColor indices).
const _allPiles = defaultCubes(); // 96 positions, 24 per color in back→front order
const _SUPPLY_META = [
  { color: "black",  fill: "#1a1a1a", src: blackVirusSrc,  iconX: 20.52, iconY: 89.41, labelX: 22.6, labelY: 87.0 },
  { color: "yellow", fill: "#FFFA73", src: yellowVirusSrc, iconX: 3.21,  iconY: 89.41, labelX: 5.3,  labelY: 87.0 },
  { color: "red",    fill: "#cc1111", src: redVirusSrc,    iconX: 8.97,  iconY: 89.41, labelX: 11.1, labelY: 87.0 },
  { color: "blue",   fill: "#0A00A1", src: blueVirusSrc,   iconX: 14.77, iconY: 89.41, labelX: 16.9, labelY: 87.0 },
];
// SUPPLY_PILES is completed after imports are available (src filled at runtime below component def)
const SUPPLY_PILES = _SUPPLY_META.map((m, ci) => ({
  ...m,
  positions: _allPiles.slice(ci * 24, (ci + 1) * 24),
}));

const SCENARIO_LABELS: Record<string, string> = {
  board: "Board",
  month0: "Month 0",
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
};

export function Board({ setup, fundingCards: fundingCardsProp, scenario = "month0", onInfectionDone, onChooseRoles, onResumeRoles, onRestart, onMainMenu }: {
  setup?: PreGameSetup;
  fundingCards?: string[];   // passed before setup is ready (deal phase)
  scenario?: string;
  onInfectionDone?: () => void;
  onChooseRoles?: (playerCount: number) => void;
  onResumeRoles?: () => void;
  onRestart?: () => void;
  onMainMenu?: () => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [states, setStates] = useState<MarkerState[]>(() => MARKERS.map(m => loadMarker(m.key, m.def)));
  // Month 0 is a fresh setup scenario — it never restores saved progress.
  // All other scenarios (campaign months + board sandbox) persist these.
  const _persistGame = scenario !== "month0"; void _persistGame;
  const [cured, setCured] = useState<boolean[]>(() => loadCured());
  const [eradicated, setEradicated] = useState<boolean[]>(() => loadEradicated());
  const [outbreakPos, setOutbreakPos] = useState(() => loadTrackPos(LS_OUTBREAK_POS, OUTBREAK_TRACK.length - 1));
  const [infectionPos, setInfectionPos] = useState(() => loadTrackPos(LS_INFECTION_POS, INFECTION_TRACK.length - 1));
  const [cityInfection, setCityInfection] = useState<CityInfectionMap>(() => {
    try { const r = localStorage.getItem(LS_CITY_INFECTION); if (r) return JSON.parse(r); } catch { /* ignore */ }
    return {};
  });
  const [outbreakQueue, setOutbreakQueue] = useState<{ cityId: string; color: DiseaseColor }[]>([]);
  const [outbreakAlready, setOutbreakAlready] = useState<Set<string>>(new Set());
  const [epidemicState, setEpidemicState] = useState<{ phase: 'infect' | 'intensify'; infectedCityId: string | null; infectedColor: DiseaseColor | null } | null>(null);
  // 9 → 0: first 3 draws place 3 cubes (red), next 3 place 2 (orange), last 3 place 1 (yellow)
  // Only month0 runs the initial infection phase; other scenarios skip it.
  const [setupRemaining, setSetupRemaining] = useState<number>(() =>
    (scenario === "month0" && !setup) ? 9 : 0
  );
  // Card pile positions persist (calibration data)
  const [cardInfection, setCardInfection] = useState<CardState>(() => loadCard(LS_CARD_INFECTION, DEF_CARD_INFECTION));
  const [cardPlayer, setCardPlayer] = useState<CardState>(() => loadCard(LS_CARD_PLAYER, DEF_CARD_PLAYER));
  const [cardInfectionDiscard, setCardInfectionDiscard] = useState<CardState>(() => loadCard(LS_CARD_INFECTION_DISCARD, DEF_CARD_INFECTION_DISCARD));
  const [cardPlayerDiscard] = useState<CardState>(() => loadCard(LS_CARD_PLAYER_DISCARD, DEF_CARD_PLAYER_DISCARD));
  const [hcmcTray, setHcmcTray] = useState<{ x: number; y: number }>(() => loadHcmc());
  // 0 when epidemics are embedded in the deck (deal/game phases); 5 for raw board view
  const [epidemicCount, setEpidemicCount] = useState(() => {
    try { const r = localStorage.getItem(LS_EPIDEMIC_COUNT); if (r !== null) return Number(r); } catch { /* ignore */ }
    return 5;
  }); // standalone pile, rendered below player deck
  const [tokenP1, setTokenP1] = useState<CardState>(() => loadCard(LS_TOKEN_P1, DEF_TOKEN_P1));
  const [tokenP2, setTokenP2] = useState<CardState>(() => loadCard(LS_TOKEN_P2, DEF_TOKEN_P2));
  const [tokenP3, setTokenP3] = useState<CardState>(() => loadCard(LS_TOKEN_P3, DEF_TOKEN_P3));
  const [tokenP4, setTokenP4] = useState<CardState>(() => loadCard(LS_TOKEN_P4, DEF_TOKEN_P4));
  const [roleHover, setRoleHover] = useState<string | null>(null);

  // P1 = first token placed, P2 = second, etc. — order from setup
  const activePlayers = setup
    ? (['p1','p2','p3','p4'] as const).slice(0, setup.playerOrder.length)
    : (['p1', 'p2'] as const);

  // Dynamic color per player slot based on placement order
  const playerColors: Record<string, string> = setup
    ? Object.fromEntries(setup.playerOrder.map((p, i) => [`p${i + 1}`, p.color]))
    : { p1: "#e8479a", p2: "#e8720a", p3: "#f0f0f0", p4: "#1a2a8a" };
  const [handCards, setHandCards] = useState<HandCards>(loadHandCards);
  const [handHover, setHandHover] = useState<{ player: string; idx: number; x: number; y: number } | null>(null);
  const [handDrag, setHandDrag] = useState<{ player: string; idx: number; x: number; y: number } | null>(null);
  const saveHandCards = (next: HandCards) => { setHandCards(next); localStorage.setItem(LS_HAND_CARDS, JSON.stringify(next)); };
  const handStackOffset = (area: typeof HAND_P1, count: number) =>
    count <= 1 ? 0 : Math.min(4, (area.h - area.w * BOARD_RATIO) / (count - 1));
  const [roadblocks, setRoadblocks] = useState<Record<string, RoadblockState>>(loadRoadblocks);
  const [researchStations, setResearchStations] = useState<Set<string>>(() => loadResearchStations());
  const [researchPos, setResearchPos] = useState<Record<string, { x: number; y: number }>>(() => loadResearchPos());
  const [panicLevels, setPanicLevels] = useState<Record<string, number>>(() => loadPanicLevels());
  const [cityMenu, setCityMenu] = useState<{ cityId: string; x: number; y: number } | null>(null);
  const [cityMenuHover, setCityMenuHover] = useState<string | null>(null);
  const cityMenuHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setCityMenuHoverDelayed = (val: string | null) => {
    if (cityMenuHoverTimer.current) clearTimeout(cityMenuHoverTimer.current);
    if (val !== null) { setCityMenuHover(val); return; }
    cityMenuHoverTimer.current = setTimeout(() => setCityMenuHover(null), 150);
  };
  const [objectiveCount, setObjectiveCount] = useState(1);
  const [objectiveCompleted, setObjectiveCompleted] = useState<boolean[]>([false]);
  const [objMenu, setObjMenu] = useState<{ x: number; y: number; idx: number } | null>(null);
  const [infectDeck, setInfectDeck] = useState<string[]>(() => {
    try { const r = localStorage.getItem(LS_INFECT_DECK); if (r) return JSON.parse(r); } catch { /* ignore */ }
    return shuffle(CITIES.map(c => c.id));
  });
  const [infectDiscard, setInfectDiscard] = useState<string[]>(() => {
    try { const r = localStorage.getItem(LS_INFECT_DISCARD); if (r) return JSON.parse(r); } catch { /* ignore */ }
    return [];
  });
  const [flippingInfCard, setFlippingInfCard] = useState<{ cityId: string; fromX: number; fromY: number; toX: number; toY: number } | null>(null);
  const [isShufflingInfection, setIsShufflingInfection] = useState(false);
  const [flippingPlayerCard, setFlippingPlayerCard] = useState<{ cityId: string; x: number; y: number; reverse?: boolean } | null>(null);
  const [isShufflingPlayer, setIsShufflingPlayer] = useState(false);
  const [playerDeck, setPlayerDeck] = useState<string[]>(() => {
    try { const r = localStorage.getItem(LS_PLAYER_DECK); if (r) return JSON.parse(r); } catch { /* ignore */ }
    const fc = setup?.fundingCards ?? [];
    return shuffle([...CITIES.map(c => c.id), ...fc]);
  });
  const [playerFlipped, setPlayerFlipped] = useState<Set<string>>(() => new Set());
  const [playerDiscard, setPlayerDiscard] = useState<string[]>([]);
  const [playerDrag, setPlayerDrag] = useState<{ cityId: string; x: number; y: number } | null>(null);
  const [boardPxW, setBoardPxW] = useState(0);
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showPlayerDiscardPopup, setShowPlayerDiscardPopup] = useState(false);
  const [showDebugDeck, setShowDebugDeck] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [discardCardMenu, setDiscardCardMenu] = useState<{ cityId: string; x: number; y: number } | null>(null);
  const [playerDeckMenu, setPlayerDeckMenu] = useState<{ x: number; y: number } | null>(null);
  const [discardMenu, setDiscardMenu] = useState<{ x: number; y: number } | null>(null);
  const [deckMenu, setDeckMenu] = useState<{ x: number; y: number } | null>(null);
  const [forecastCards, setForecastCards] = useState<string[] | null>(null);
  const [dismissedResult, setDismissedResult] = useState<string | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  type ActionSnapshot = {
    turnState: TurnStateData; playerCities: string[]; cityInfection: CityInfectionMap;
    cured: boolean[]; eradicated: boolean[]; handCards: HandCards; playerDiscard: string[];
    researchStations: Set<string>; researchPos: Record<string, { x: number; y: number }>;
    outbreakPos: number;
    tokenP1: CardState; tokenP2: CardState; tokenP3: CardState; tokenP4: CardState;
  };
  const [undoSnapshot, setUndoSnapshot] = useState<ActionSnapshot | null>(null);

  // ─── January-specific state ────────────────────────────────────────────────
  const isJan = scenario === 'jan';
  const [codaColor, setCodaColor] = useState<DiseaseColor | null>(() =>
    isJan ? (loadCodaColor() as DiseaseColor | null) : null
  );
  const [diseaseNames, setDiseaseNames] = useState<Record<string, string>>(() =>
    isJan ? loadDiseaseNames() : {}
  );
  const [codaPopupOpen, setCodaPopupOpen] = useState(false);
  const [codaCandidates, setCodaCandidates] = useState<DiseaseColor[]>([]);
  const [namePopupColor, setNamePopupColor] = useState<DiseaseColor | null>(null);

  // Turn system — only active during game phase (setup present)
  const [turnState, setTurnState_] = useState<TurnStateData>(() => loadTurnState());

  // When setup first becomes available and there's no persisted turn state,
  // correct actionsRemaining for the generalist (who starts with 5, not 4).
  useEffect(() => {
    if (!setup) return;
    if (localStorage.getItem(LS_TURN)) return; // persisted state already has the right value
    const firstRole = setup.playerOrder[0]?.roleId;
    if (firstRole === 'generalist') {
      setTurnState_(prev => ({ ...prev, actionsRemaining: 5 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);
  const saveTurnState = (next: TurnStateData) => {
    if (setup && next.actionsRemaining < turnState.actionsRemaining && next.phase === "actions") {
      const role = setup.playerOrder[turnState.currentPlayerIndex]?.roleId ?? '?';
      const ROLE_LABELS: Record<string, string> = { medic: 'Medic', scientist: 'Scientist', researcher: 'Researcher', generalist: 'Generalist', dispatcher: 'Dispatcher' };
      setActionLog(prev => [...prev.slice(-49), `${ROLE_LABELS[role] ?? role}: action used (${next.actionsRemaining} left)`]);
    }
    if (setup && next.phase === "draw" && turnState.phase === "actions") {
      const role = setup.playerOrder[turnState.currentPlayerIndex]?.roleId ?? '?';
      const ROLE_LABELS: Record<string, string> = { medic: 'Medic', scientist: 'Scientist', researcher: 'Researcher', generalist: 'Generalist', dispatcher: 'Dispatcher' };
      setActionLog(prev => [...prev.slice(-49), `${ROLE_LABELS[role] ?? role}: drawing cards`]);
    }
    // Auto-snapshot before any action is consumed (React batches updates so closure values are still pre-action)
    if (setup && turnState.phase === "actions" && next.actionsRemaining < turnState.actionsRemaining) {
      setUndoSnapshot({
        turnState: { ...turnState }, playerCities: [...playerCities],
        cityInfection: { ...cityInfection }, cured: [...cured], eradicated: [...eradicated],
        handCards: { ...handCards }, playerDiscard: [...playerDiscard],
        researchStations: new Set(researchStations), researchPos: { ...researchPos },
        outbreakPos,
        tokenP1: { ...tokenP1 }, tokenP2: { ...tokenP2 }, tokenP3: { ...tokenP3 }, tokenP4: { ...tokenP4 },
      });
    }
    setTurnState_(next); localStorage.setItem(LS_TURN, JSON.stringify(next));
  };
  const [playerCities, setPlayerCities_] = useState<string[]>(() => setup ? loadPlayerCities(setup.playerOrder.length) : []);
  const savePlayerCities = (next: string[]) => { setPlayerCities_(next); localStorage.setItem(LS_PLAYER_CITIES, JSON.stringify(next)); };
  const [highlightCities, setHighlightCities] = useState<string[]>([]);
  const [selectedHandCards, setSelectedHandCards] = useState<string[]>([]);
  const [cureSelecting, setCureSelecting] = useState(false);
  const [quietNight, setQuietNight] = useState(false);
  const [eventMode, setEventMode] = useState<null | 'remote-treatment' | 'govt-grant' | 'resilient-pop' | 'airlift' | 'flexible-aid'>(null);
  const [eventModeRemaining, setEventModeRemaining] = useState(0);
  // Snapshot of cube state when Remote Treatment starts, so cancelling part-way
  // through restores any cubes already removed.
  const cubeSnapshotRef = useRef<CityInfectionMap | null>(null);
  const [, setAirliftPawn] = useState<string | null>(null);
  const [flexibleAidSelected, setFlexibleAidSelected] = useState<string[]>([]);
  // Bonus actions stored when Borrowed Time is played outside the actions phase
  const [bonusActionsNextTurn, setBonusActionsNextTurn] = useState(0);
  const [pendingEventCard, setPendingEventCard] = useState<{ player: string; idx: number; cardId: string } | null>(null);
  const [pendingDiscardMenu, setPendingDiscardMenu] = useState<{ cityId: string; player: string; idx: number; x: number; y: number } | null>(null);
  const [rsActionMenu, setRsActionMenu] = useState<{ cityId: string; x: number; y: number } | null>(null);

  // Turn helpers (must come after all useState declarations)
  const currentPlayerKey: string = setup ? ((['p1','p2','p3','p4'] as const).slice(0, setup.playerOrder.length)[turnState.currentPlayerIndex] ?? 'p1') : 'p1';
  const currentPlayerCityId: string = playerCities[turnState.currentPlayerIndex] ?? "atlanta";
  const roleId = setup?.playerOrder[turnState.currentPlayerIndex]?.roleId ?? null;
  const cureThreshold = roleId === 'scientist' ? 4 : 5;
  const consumeAction = (ts: TurnStateData): TurnStateData => {
    const remaining = ts.actionsRemaining - 1;
    if (remaining <= 0) return { ...ts, actionsRemaining: 0, phase: "draw", drawCount: 0 };
    return { ...ts, actionsRemaining: remaining };
  };
  const snapPawnToCity = (playerKey: string, cityId: string) => {
    const city = CITIES.find(c => c.id === cityId);
    if (!city || !setup) return;
    const pi = (['p1','p2','p3','p4'] as const).indexOf(playerKey as 'p1'|'p2'|'p3'|'p4');
    if (pi < 0) return;
    const offsets: [number, number][] = [[-1, 0], [1, 0], [-1, 1.5], [1, 1.5]];
    const [dx, dy] = offsets[pi] ?? [0, 0];
    const pos = { x: city.pos.x + dx, y: city.pos.y + dy, w: 2.42 };
    const setters = [setTokenP1, setTokenP2, setTokenP3, setTokenP4];
    const lsKeys = [LS_TOKEN_P1, LS_TOKEN_P2, LS_TOKEN_P3, LS_TOKEN_P4];
    setters[pi](pos); localStorage.setItem(lsKeys[pi], JSON.stringify(pos));
    // Medic: auto-remove cured disease cubes on arrival (no action cost)
    if (setup?.playerOrder[pi]?.roleId === 'medic') {
      let inf = cityInfection;
      for (const color of DISEASE_COLORS) {
        const ci = COLOR_TO_CURE_IDX[color];
        if (ci === undefined || !cured[ci]) continue;
        const count = inf[cityId]?.[color] ?? 0;
        if (count <= 0) continue;
        inf = { ...inf, [cityId]: { ...inf[cityId], [color]: 0 } };
        if (!eradicated[ci] && totalOfColor(inf, color) === 0) {
          setEradicated(prev => { const n = [...prev]; n[ci] = true; return n; });
          if (isJan && !diseaseNames[color]) setNamePopupColor(color as DiseaseColor);
        }
      }
      if (inf !== cityInfection) saveCityInfection(inf);
    }
  };
  const nearestCity = (px: number, py: number): string | null => {
    let bestId: string | null = null; let bestDist = 8;
    for (const c of CITIES) {
      const dx = px - c.pos.x; const dy = py - c.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) { bestDist = dist; bestId = c.id; }
    }
    return bestId;
  };
  const advanceTurn = () => {
    if (!setup) return;
    const nextIdx = (turnState.currentPlayerIndex + 1) % setup.playerOrder.length;
    const nextRoleId = setup.playerOrder[nextIdx]?.roleId ?? null;
    const baseActions = nextRoleId === 'generalist' ? 5 : 4;
    saveTurnState({ currentPlayerIndex: nextIdx, actionsRemaining: baseActions + bonusActionsNextTurn, phase: "actions", pendingCharter: false, pendingShuttle: false, drawCount: 0, infectCount: 0 });
    setBonusActionsNextTurn(0);
    setHighlightCities([]); setSelectedHandCards([]); setCureSelecting(false);
    setEventMode(null); setAirliftPawn(null); setFlexibleAidSelected([]); setEventModeRemaining(0); setPendingEventCard(null);
    setUndoSnapshot(null);
  };
  const restoreUndoSnapshot = () => {
    const s = undoSnapshot; if (!s) return;
    setTurnState_(s.turnState); localStorage.setItem(LS_TURN, JSON.stringify(s.turnState));
    setPlayerCities_(s.playerCities); localStorage.setItem(LS_PLAYER_CITIES, JSON.stringify(s.playerCities));
    setCityInfection(s.cityInfection); localStorage.setItem(LS_CITY_INFECTION, JSON.stringify(s.cityInfection));
    setCured(s.cured); setEradicated(s.eradicated);
    setHandCards(s.handCards); localStorage.setItem(LS_HAND_CARDS, JSON.stringify(s.handCards));
    setPlayerDiscard(s.playerDiscard);
    setResearchStations(s.researchStations); localStorage.setItem(LS_RESEARCH_STATIONS, JSON.stringify([...s.researchStations]));
    setResearchPos(s.researchPos); localStorage.setItem(LS_RESEARCH_POS, JSON.stringify(s.researchPos));
    setOutbreakPos(s.outbreakPos);
    setTokenP1(s.tokenP1); localStorage.setItem(LS_TOKEN_P1, JSON.stringify(s.tokenP1));
    setTokenP2(s.tokenP2); localStorage.setItem(LS_TOKEN_P2, JSON.stringify(s.tokenP2));
    setTokenP3(s.tokenP3); localStorage.setItem(LS_TOKEN_P3, JSON.stringify(s.tokenP3));
    setTokenP4(s.tokenP4); localStorage.setItem(LS_TOKEN_P4, JSON.stringify(s.tokenP4));
    setHighlightCities([]); setSelectedHandCards([]); setCureSelecting(false);
    setEventMode(null); setAirliftPawn(null);
    setUndoSnapshot(null);
  };

  const currentPlayerHand = useMemo(() => (handCards as Record<string, string[]>)[currentPlayerKey] ?? [], [handCards, currentPlayerKey]);

  const resolveEventCard = (pending: { player: string; idx: number; cardId: string }) => {
    const current = (handCards as Record<string,string[]>)[pending.player] ?? [];
    // Remove by identity (first matching cardId) — idx can go stale if the hand
    // reorders or other cards are discarded before a multi-step event resolves.
    const removeAt = current.indexOf(pending.cardId);
    const next = removeAt >= 0 ? current.filter((_, j) => j !== removeAt) : current;
    saveHandCards({ ...handCards, [pending.player]: next });
    setPlayerDiscard(prev => [...prev, pending.cardId]);
    setPendingEventCard(null);
  };


  // Month 0 + campaign months: place research station (and for Month 0 player tokens) at Atlanta — runs once
  const setupInitialized = useRef(false);
  useEffect(() => {
    if (!setup || setupInitialized.current) return;
    const isCampaignMonth = scenario !== "month0" && scenario !== "board";
    if (scenario !== "month0" && !isCampaignMonth) return;
    setupInitialized.current = true;
    const atlanta = CITIES.find(c => c.id === "atlanta");
    if (!atlanta) return;

    // Research station at Atlanta (Month 0 and all campaign months)
    setResearchStations(prev => {
      if (prev.has("atlanta")) return prev;
      const next = new Set(prev); next.add("atlanta");
      localStorage.setItem(LS_RESEARCH_STATIONS, JSON.stringify([...next]));
      return next;
    });

    if (scenario !== "month0") return; // campaign months: RS only, no forced token placement

    // Month 0 only: place player tokens at Atlanta
    const offsets = [[-1, 0], [1, 0], [-1, 1.5], [1, 1.5]];
    const tokenSetters = [
      { set: setTokenP1, lsKey: LS_TOKEN_P1 },
      { set: setTokenP2, lsKey: LS_TOKEN_P2 },
      { set: setTokenP3, lsKey: LS_TOKEN_P3 },
      { set: setTokenP4, lsKey: LS_TOKEN_P4 },
    ];
    const savedCities = loadPlayerCities(setup.playerOrder.length);
    const hasMovedAway = savedCities.some(c => c !== "atlanta");
    setup.playerOrder.forEach((_, pi) => {
      const cityId = hasMovedAway ? (savedCities[pi] ?? "atlanta") : "atlanta";
      const city = hasMovedAway ? (CITIES.find(c => c.id === cityId) ?? atlanta) : atlanta;
      const [dx, dy] = offsets[pi] ?? [0, 0];
      const pos = { x: city.pos.x + dx, y: city.pos.y + dy, w: 2.42 };
      tokenSetters[pi].set(pos);
      if (!hasMovedAway) localStorage.setItem(tokenSetters[pi].lsKey, JSON.stringify(pos));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);

  // Panic levels are permanent legacy state — save whenever they change
  useEffect(() => {
    localStorage.setItem(LS_PANIC_LEVELS, JSON.stringify(panicLevels));
  }, [panicLevels]);

  // Persist cure / eradication / outbreak-rate / infection-rate progress so a
  // reload restores the game. Skipped in Month 0 (always a fresh setup).
  const playerDeckRef = useRef<string[]>(playerDeck);
  useEffect(() => { playerDeckRef.current = playerDeck; localStorage.setItem(LS_PLAYER_DECK, JSON.stringify(playerDeck)); }, [playerDeck]);
  useEffect(() => { localStorage.setItem(LS_EPIDEMIC_COUNT, String(epidemicCount)); }, [epidemicCount]);
  useEffect(() => { localStorage.setItem(LS_INFECT_DECK, JSON.stringify(infectDeck)); }, [infectDeck]);
  useEffect(() => { localStorage.setItem(LS_INFECT_DISCARD, JSON.stringify(infectDiscard)); }, [infectDiscard]);
  useEffect(() => { localStorage.setItem(LS_CURED, JSON.stringify(cured)); }, [cured]);
  useEffect(() => { localStorage.setItem(LS_ERADICATED, JSON.stringify(eradicated)); }, [eradicated]);
  useEffect(() => { localStorage.setItem(LS_OUTBREAK_POS, String(outbreakPos)); }, [outbreakPos]);
  useEffect(() => { localStorage.setItem(LS_INFECTION_POS, String(infectionPos)); }, [infectionPos]);

  // Auto-advance discard once the current player's hand is ≤ 7
  // Mid-draw discard (drawCount < 2): return to draw phase to pick up 2nd card
  // Post-draw discard (drawCount >= 2): advance to infect phase
  useEffect(() => {
    if (!setup || turnState.phase !== "discard") return;
    const hand = (handCards as Record<string, string[]>)[currentPlayerKey] ?? [];
    if (hand.length <= 7) {
      if (turnState.drawCount < 2) {
        saveTurnState({ ...turnState, phase: "draw" });
      } else {
        saveTurnState({ ...turnState, phase: "infect", infectCount: 0 });
      }
    }
  }, [handCards, turnState.phase]);

  // Auto-resume actions once the designated player has discarded to ≤ 7 (Share Knowledge over-limit)
  useEffect(() => {
    if (!setup || turnState.phase !== "discard-action" || !turnState.discardPlayer) return;
    const hand = (handCards as Record<string, string[]>)[turnState.discardPlayer] ?? [];
    if (hand.length <= 7) saveTurnState({ ...turnState, phase: "actions", discardPlayer: undefined });
  }, [handCards, turnState.phase]);

  // Auto-advance infect → next turn once all infection cards are drawn; skip entirely if Quiet Night
  useEffect(() => {
    if (!setup || turnState.phase !== "infect") return;
    if (quietNight) {
      setQuietNight(false);
      advanceTurn();
      return;
    }
    const target = INFECTION_RATE_VALUES[infectionPos] ?? 2;
    if (turnState.infectCount >= target) advanceTurn();
  }, [turnState.infectCount, turnState.phase, quietNight]);

  // Auto-complete objective 0 when all 4 diseases are cured
  useEffect(() => {
    if (cured.length === 4 && cured.every(Boolean)) {
      setObjectiveCompleted(prev => {
        if (prev[0]) return prev; // already marked
        const next = [...prev];
        next[0] = true;
        return next;
      });
    }
  }, [cured]);

  // When funding cards are confirmed (deal phase): rebuild deck with city + event cards
  const prevFcKey = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (fundingCardsProp === undefined) return;
    const key = fundingCardsProp.join(',');
    if (key === prevFcKey.current) return;
    prevFcKey.current = key;
    setPlayerDeck(shuffle([...CITIES.map(c => c.id), ...fundingCardsProp]));
    setEpidemicCount(5);
    setPlayerFlipped(new Set());
  }, [fundingCardsProp]);

  useEffect(() => {
    if (!boardRef.current) return;
    const ro = new ResizeObserver(e => setBoardPxW(e[0].contentRect.width));
    ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  const shuffleDeck = () => {
    setInfectDeck(shuffle(infectDeck));
    setDeckMenu(null);
  };

  const openForecast = () => {
    const top6 = infectDeck.slice(-6).reverse(); // top card first
    setForecastCards(top6);
    setDeckMenu(null);
  };

  const confirmForecast = () => {
    if (!forecastCards) return;
    // forecastCards[0] = will be drawn first = goes on top of deck (last element)
    const base = infectDeck.slice(0, infectDeck.length - forecastCards.length);
    const newDeck = [...base, ...forecastCards.slice().reverse()];
    setInfectDeck(newDeck);
    setForecastCards(null);
  };

  const shuffleDiscardOntoDeck = () => {
    setIsShufflingInfection(true);
    setDiscardMenu(null);
    const snapshot = [...infectDiscard];
    const wasEpidemic = epidemicState;
    setTimeout(() => {
      setInfectDeck(prev => [...prev, ...shuffle(snapshot)]);
      setInfectDiscard([]);
      setIsShufflingInfection(false);
      if (wasEpidemic) {
        // Step 3 complete — clear state and move the resolved epidemic to discard.
        setEpidemicState(null);
        setPlayerFlipped(prev => { const n = new Set(prev); n.delete("epidemic"); return n; });
        const deckNow = playerDeckRef.current;
        if (deckNow[deckNow.length - 1] === "epidemic") {
          setPlayerDeck(deckNow.slice(0, -1));
          setPlayerDiscard(prev => [...prev, "epidemic"]);
        }
        // Count the epidemic as a draw — it goes to discard here, not via the hand-interaction path
        if (setup && wasEpidemic.phase !== null) {
          setTurnState_(prev => {
            if (prev.phase !== "draw") return prev;
            const newCount = prev.drawCount + 1;
            if (newCount >= 2) {
              return { ...prev, drawCount: newCount, phase: "infect", infectCount: 0 };
            }
            return { ...prev, drawCount: newCount };
          });
        }
        // January: after 2nd epidemic resolves (3 remain in deck), trigger COdA naming
        if (isJan && codaColor === null) {
          const deckAfter = deckNow[deckNow.length - 1] === "epidemic"
            ? deckNow.slice(0, -1)
            : deckNow;
          const epRemaining = deckAfter.filter(c => c === "epidemic").length;
          if (epRemaining === 3) {
            const totals = DISEASE_COLORS.map(c => ({ c, n: totalOfColor(cityInfection, c) }));
            const max = Math.max(...totals.map(t => t.n));
            const candidates = totals.filter(t => t.n === max).map(t => t.c);
            if (candidates.length === 1) {
              const named = candidates[0];
              setCodaColor(named);
              localStorage.setItem(LS_CODA_COLOR, named);
              setCodaCandidates([]);
            } else {
              setCodaCandidates(candidates as DiseaseColor[]);
            }
            setCodaPopupOpen(true);
          }
        }
      }
    }, 900);
  };

  const shuffleEpidemicsIntoDeck = (deck: string[], count: number) => {
    const embeddedEpidemics = deck.filter(id => id === "epidemic").length;
    const totalEpidemics = count + embeddedEpidemics;
    const cityCards = shuffle(deck.filter(id => id !== "epidemic"));
    const numPiles = Math.max(1, Math.min(totalEpidemics || 5, 5));
    const base = Math.floor(cityCards.length / numPiles);
    const extras = cityCards.length % numPiles;
    const piles: string[][] = [];
    let idx = 0;
    for (let p = 0; p < numPiles; p++) {
      const size = base + (p < extras ? 1 : 0);
      piles.push(cityCards.slice(idx, idx + size));
      idx += size;
    }
    for (let p = 0; p < numPiles && p < totalEpidemics; p++) {
      const at = Math.floor(Math.random() * (piles[p].length + 1));
      piles[p].splice(at, 0, "epidemic");
      piles[p] = shuffle(piles[p]);
    }
    piles.sort((a, b) => a.length - b.length);
    return piles.flat();
  };

  const drawInfectionCard = () => {
    if (infectDeck.length === 0) return;
    // Count infection draws during infect phase
    if (setup && turnState.phase === "infect") {
      const target = INFECTION_RATE_VALUES[infectionPos] ?? 2;
      const next = turnState.infectCount + 1;
      saveTurnState({ ...turnState, infectCount: next });
      // Note: advanceTurn is called via "End Infection" button after all N drawn
      if (next >= target) {
        // Will show End Infection button via render logic — no auto-advance
      }
    }
    const newDeck = [...infectDeck];
    const drawn = newDeck.pop()!;
    // Compute exact top-card position (with stack offset) before state updates
    const INF_STEP = 0.10;
    const fromLayers = Math.max(0, Math.min(infectDeck.length, 10));
    const fromOffset = (fromLayers - 1) * INF_STEP;
    const toDiscardLayers = Math.min(infectDiscard.length + 1, 10);
    const toOffset = (toDiscardLayers - 1) * INF_STEP;
    setFlippingInfCard({
      cityId: drawn,
      fromX: cardInfection.x + fromOffset,
      fromY: cardInfection.y - fromOffset * BOARD_RATIO,
      toX: cardInfectionDiscard.x + toOffset,
      toY: cardInfectionDiscard.y - toOffset * BOARD_RATIO,
    });
    setInfectDeck(newDeck);
    setInfectDiscard(prev => [...prev, drawn]);
    setTimeout(() => setFlippingInfCard(null), 700);

    const city = CITIES.find(c => c.id === drawn);
    if (city) {
      const color = city.color as DiseaseColor;
      const cur = cityInfection[drawn]?.[color] ?? 0;

      if (setupRemaining > 0) {
        // Initial infection phase: place N cubes at once
        const cubes = setupRemaining > 6 ? 3 : setupRemaining > 3 ? 2 : 1;
        const next = { ...cityInfection, [drawn]: { ...cityInfection[drawn], [color]: Math.min(3, cur + cubes) } };
        saveCityInfection(next);
        setSetupRemaining(prev => prev - 1);
      } else {
        // Normal infection: skip if eradicated
        if (!isColorEradicated(color)) {
          if (cur >= 3) {
            triggerOutbreak(drawn, color, new Set());
          } else {
            if (totalOfColor(cityInfection, color) < 24) {
              saveCityInfection({ ...cityInfection, [drawn]: { ...cityInfection[drawn], [color]: cur + 1 } });
            }
          }
        }
      }
    }
  };

  const update = (i: number) => (s: MarkerState) => {
    setStates(prev => { const next = [...prev]; next[i] = s; return next; });
    localStorage.setItem(MARKERS[i].key, JSON.stringify(s));
  };

  const effectiveState = (i: number): MarkerState => {
    if (i === 0 && OUTBREAK_TRACK[outbreakPos]?.x !== 0)
      return { ...states[i], ...OUTBREAK_TRACK[outbreakPos] };
    if (i === 2 && INFECTION_TRACK[infectionPos]?.x !== 0)
      return { ...states[i], ...INFECTION_TRACK[infectionPos] };
    const ci = CURE_INDICES.indexOf(i);
    if (ci >= 0 && cured[ci] && MARKERS[i].curePos)
      return { ...states[i], ...MARKERS[i].curePos };
    return states[i];
  };

  // Click on a cure START or CURE space to move that token there.
  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (calibrating) return;
    const r = boardRef.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width) * 100;
    const py = ((e.clientY - r.top) / r.height) * 100;

    // Outbreak / infection tracks: only freely clickable in pure sandbox (no game, no deal phase, infection done)
    if (!setup && !onChooseRoles && setupRemaining === 0) {
      const obW = states[0].w;
      for (let i = 0; i < OUTBREAK_TRACK.length; i++) {
        const p = OUTBREAK_TRACK[i];
        if (p.x === 0 && p.y === 0) continue;
        if (inBox(px, py, p.x, p.y, obW)) { setOutbreakPos(i); return; }
      }
      const irW = states[2].w;
      for (let i = 0; i < INFECTION_TRACK.length; i++) {
        const p = INFECTION_TRACK[i];
        if (p.x === 0 && p.y === 0) continue;
        if (inBox(px, py, p.x, p.y, irW)) { setInfectionPos(i); return; }
      }
    }

    for (let ci = 0; ci < CURE_INDICES.length; ci++) {
      const mi = CURE_INDICES[ci];
      const m = MARKERS[mi];
      if (!m.curePos) continue;
      const startPos = states[mi];

      if (!setup) {
        if (inBox(px, py, startPos.x, startPos.y, startPos.w)) {
          setCured(prev => { const n = [...prev]; n[ci] = false; return n; });
          setEradicated(prev => { const n = [...prev]; n[ci] = false; return n; });
          return;
        }
        if (inBox(px, py, m.curePos.x, m.curePos.y, startPos.w)) {
          setCured(prev => { const n = [...prev]; n[ci] = true; return n; });
          return;
        }
      }
    }
  };

  const saveCityInfection = (next: CityInfectionMap) => {
    setCityInfection(next);
    localStorage.setItem(LS_CITY_INFECTION, JSON.stringify(next));
  };

  // Total cubes of a color across all cities
  const totalOfColor = (inf: CityInfectionMap, color: DiseaseColor) =>
    Object.values(inf).reduce((sum, cc) => sum + (cc[color] ?? 0), 0);

  // Trigger an outbreak: advances marker, marks city as already-outbroken,
  // queues all eligible neighbors as manual cube-placement targets.
  const triggerOutbreak = (cityId: string, color: DiseaseColor, baseAlready: Set<string>) => {
    if (isColorEradicated(color)) return;
    setOutbreakPos(prev => Math.min(OUTBREAK_TRACK.length - 1, prev + 1));
    const city = CITIES.find(c => c.id === cityId);
    if (!city) return;
    // January onward: each outbreak permanently raises that city's panic level
    if (scenario !== "month0") {
      setPanicLevels(prev => {
        const cur = prev[cityId] ?? 0;
        if (cur >= 5) return prev;
        const next = { ...prev, [cityId]: cur + 1 };
        localStorage.setItem(LS_PANIC_LEVELS, JSON.stringify(next));
        return next;
      });
    }
    const newAlready = new Set([...baseAlready, cityId]);
    setOutbreakAlready(newAlready);
    const targets = city.neighbors.filter(nid => !newAlready.has(nid));
    if (targets.length > 0) {
      setOutbreakQueue(prev => {
        const newEntries = targets
          .filter(tid => !prev.some(q => q.cityId === tid && q.color === color))
          .map(tid => ({ cityId: tid, color }));
        return [...prev, ...newEntries];
      });
    }
  };

  // Player manually clicks a highlighted chain city to place 1 cube there.
  const handleChainClick = (cityId: string, color: DiseaseColor) => {
    // Remove from queue
    setOutbreakQueue(prev => prev.filter(q => !(q.cityId === cityId && q.color === color)));
    if (isColorEradicated(color)) return;
    const cur = cityInfection[cityId]?.[color] ?? 0;
    if (cur >= 3) {
      // City already full → chain outbreak from here
      triggerOutbreak(cityId, color, outbreakAlready);
    } else {
      // Place 1 cube
      if (totalOfColor(cityInfection, color) < 24) {
        saveCityInfection({ ...cityInfection, [cityId]: { ...cityInfection[cityId], [color]: cur + 1 } });
      }
    }
  };

  const handleCityClick = (cityId: string) => {
    if (isDealPhase) return;
    if (outbreakQueue.length > 0) return; // block clicks during chain resolution
    // In any real scenario (month0, january…), block manual cube placement; only board sandbox allows it
    if (!setup && scenario !== "board") return;

    // Event card modes — work in any phase
    if (eventMode === 'govt-grant') {
      const next = new Set(researchStations); next.add(cityId);
      setResearchStations(next); localStorage.setItem(LS_RESEARCH_STATIONS, JSON.stringify([...next]));
      setEventMode(null); setHighlightCities([]);
      if (pendingEventCard) resolveEventCard(pendingEventCard);
      return;
    }

    if (setup && turnState.phase === "actions") {
      if (turnState.pendingCharter) {
        // Charter flight: fly to any city
        const nextCities = [...playerCities]; nextCities[turnState.currentPlayerIndex] = cityId;
        savePlayerCities(nextCities); snapPawnToCity(currentPlayerKey, cityId);
        setHighlightCities([]);
        saveTurnState(consumeAction({ ...turnState, pendingCharter: false }));
        return;
      }
      // No pending action: block manual cube placement in game phase
      return;
    }

    // Pre-game / board mode: manual cube placement
    const city = CITIES.find(c => c.id === cityId);
    if (!city) return;
    const color = city.color as DiseaseColor;
    if (isColorEradicated(color)) return;
    const cur = cityInfection[cityId]?.[color] ?? 0;
    if (cur >= 3) {
      triggerOutbreak(cityId, color, new Set());
    } else {
      if (totalOfColor(cityInfection, color) >= 24) return;
      saveCityInfection({ ...cityInfection, [cityId]: { ...cityInfection[cityId], [color]: cur + 1 } });
    }
  };

  const isColorEradicated = (color: DiseaseColor) => {
    const ci = COLOR_TO_CURE_IDX[color];
    return ci !== undefined && eradicated[ci];
  };

  const handleCityRightClick = (cityId: string, forceColor?: DiseaseColor) => {
    if (isDealPhase) return;
    // In pre-game phases of real scenarios, block manual cube removal
    if (!setup && scenario !== "board") return;
    const city = CITIES.find(c => c.id === cityId);
    if (!city) return;
    const color = forceColor ?? (city.color as DiseaseColor);
    const cur = cityInfection[cityId]?.[color] ?? 0;
    if (cur <= 0) return;

    // Remote Treatment: right-click any cube to remove it; resolve after 2 removals
    if (eventMode === 'remote-treatment') {
      const next = { ...cityInfection, [cityId]: { ...cityInfection[cityId], [color]: cur - 1 } };
      saveCityInfection(next);
      const ci = COLOR_TO_CURE_IDX[color];
      if (ci !== undefined && cured[ci] && !eradicated[ci] && totalOfColor(next, color) === 0) {
        setEradicated(prev => { const n = [...prev]; n[ci] = true; return n; });
        if (isJan && !diseaseNames[color]) setNamePopupColor(color as DiseaseColor);
      }
      const left = eventModeRemaining - 1;
      if (left <= 0) {
        cubeSnapshotRef.current = null;
        setEventMode(null); setEventModeRemaining(0);
        if (pendingEventCard) resolveEventCard(pendingEventCard);
      } else {
        setEventModeRemaining(left);
      }
      return;
    }

    if (setup) {
      // In game phase: cube removal only via Treat Disease action
      if (turnState.phase !== "actions") return;
      if (cityId !== currentPlayerCityId) return; // must be in same city
      // January: COdA-403a costs 2 actions; block if insufficient
      const isCoda = isJan && codaColor !== null && color === codaColor;
      if (isCoda && turnState.actionsRemaining < 2) return;
      const ci = COLOR_TO_CURE_IDX[color];
      const isDiseaseCured = ci !== undefined && cured[ci];
      if (isDiseaseCured) {
        // Remove all cubes of this color
        const next = { ...cityInfection, [cityId]: { ...cityInfection[cityId], [color]: 0 } };
        saveCityInfection(next);
        if (ci !== undefined && !eradicated[ci] && totalOfColor(next, color) === 0) {
          setEradicated(prev => { const n = [...prev]; n[ci] = true; return n; });
          if (isJan && !diseaseNames[color]) setNamePopupColor(color as DiseaseColor);
        }
      } else {
        // Medic removes ALL cubes of a color in one Treat action, even uncured
        const newCount = roleId === 'medic' ? 0 : cur - 1;
        const next = { ...cityInfection, [cityId]: { ...cityInfection[cityId], [color]: newCount } };
        saveCityInfection(next);
        if (ci !== undefined && cured[ci] && !eradicated[ci] && totalOfColor(next, color) === 0) {
          setEradicated(prev => { const n = [...prev]; n[ci] = true; return n; });
          if (isJan && !diseaseNames[color]) setNamePopupColor(color as DiseaseColor);
        }
      }
      const nextTs = isCoda ? consumeAction(consumeAction(turnState)) : consumeAction(turnState);
      saveTurnState(nextTs);
      return;
    }

    // Pre-game / board mode: free removal
    const next = { ...cityInfection, [cityId]: { ...cityInfection[cityId], [color]: cur - 1 } };
    saveCityInfection(next);
    const ci = COLOR_TO_CURE_IDX[color];
    if (ci !== undefined && cured[ci] && !eradicated[ci] && totalOfColor(next, color) === 0) {
      setEradicated(prev => { const n = [...prev]; n[ci] = true; return n; });
    }
  };

  const triggerEpidemic = () => {
    // Step 1 — Increase: advance infection rate marker
    setInfectionPos(prev => Math.min(prev + 1, INFECTION_TRACK.length - 1));
    // Step 2 — Infect: wait for player to draw the bottom card manually
    setEpidemicState({ phase: 'infect', infectedCityId: null, infectedColor: null });
  };

  // Called when player draws the bottom card during epidemic infect phase
  const epidemicInfect = (cityId: string) => {
    const city = CITIES.find(c => c.id === cityId);
    if (!city) { setEpidemicState(prev => prev ? { ...prev, phase: 'intensify' } : null); return; }
    const color = city.color as DiseaseColor;
    // Eradicated: skip cube placement, go straight to intensify
    if (isColorEradicated(color)) {
      setEpidemicState({ phase: 'intensify', infectedCityId: cityId, infectedColor: color });
      return;
    }
    const cur = cityInfection[cityId]?.[color] ?? 0;
    if (cur === 0) {
      const total = totalOfColor(cityInfection, color);
      const canPlace = Math.min(3, 24 - total);
      const inf = { ...cityInfection, [cityId]: { ...cityInfection[cityId], [color]: canPlace } };
      saveCityInfection(inf);
    } else {
      const toAdd = 3 - cur;
      let updatedInf = cityInfection;
      if (toAdd > 0) {
        const total = totalOfColor(cityInfection, color);
        const canPlace = Math.min(toAdd, 24 - total);
        updatedInf = { ...cityInfection, [cityId]: { ...cityInfection[cityId], [color]: cur + canPlace } };
      }
      if (updatedInf !== cityInfection) saveCityInfection(updatedInf);
      triggerOutbreak(cityId, color, new Set());
    }
    setEpidemicState({ phase: 'intensify', infectedCityId: cityId, infectedColor: color });
  };

  // Cubes of each color on cities (order: black, yellow, red, blue)
  const placedPerColor = useMemo(() => DISEASE_COLORS.map(color => totalOfColor(cityInfection, color)), [cityInfection]);

  const allObjectivesDone = objectiveCount > 0 && objectiveCompleted.slice(0, objectiveCount).every(Boolean);
  const cubesExhausted = placedPerColor.some(count => count >= 24);
  const playerDeckEmpty = playerDeck.length === 0 && epidemicCount === 0;
  const outbreakMaxed = outbreakPos >= OUTBREAK_TRACK.length - 1;
  const gameResult: 'win' | 'lose' | null = allObjectivesDone ? 'win'
    : (gaveUp || outbreakMaxed || playerDeckEmpty || cubesExhausted) ? 'lose'
    : null;
  const loseReason = gaveUp ? "The team gave up."
    : outbreakMaxed ? "Too many outbreaks!"
    : playerDeckEmpty ? "Player deck exhausted!"
    : "Disease cubes exhausted!";

  // Deal phase helpers (deal = onChooseRoles is defined)
  const isDealPhase = !!onChooseRoles;
  const DEAL_KEYS = ['p1','p2','p3','p4'] as const;
  const dealCounts = DEAL_KEYS.map(p => (handCards as Record<string,string[]>)[p]?.length ?? 0);
  // activeDealCount: consecutive players from P1 with ≥1 card
  const activeDealCount = (() => { let n = 0; for (const c of dealCounts) { if (c > 0) n++; else break; } return n; })();
  const dealRequiredCards = activeDealCount >= 4 ? 2 : activeDealCount === 3 ? 3 : 4;
  const dealComplete = activeDealCount >= 2 && dealCounts.slice(0, activeDealCount).every(c => c >= dealRequiredCards);
  // maxDealTargetIdx: highest player index that can receive a card (cannot skip a player)
  const maxDealTargetIdx = Math.min(activeDealCount, 3);

  // Auto-shuffle epidemic cards into the deck when game starts (setup prop arrives after roles chosen).
  // epidemicCount persists as 0 after embedding, so this only fires on a fresh game (not reload).
  const setupShuffleRef = useRef(false);
  useEffect(() => {
    if (!setup || setupShuffleRef.current || epidemicCount === 0) return;
    setupShuffleRef.current = true;
    setIsShufflingPlayer(true);
    setTimeout(() => setIsShufflingPlayer(false), 900);
    setPlayerDeck(prev => shuffleEpidemicsIntoDeck(prev, epidemicCount));
    setEpidemicCount(0);
    setPlayerFlipped(new Set());
  }, [setup, epidemicCount]);

  // Stable callback refs so React.memo(CityLayer) isn't defeated by new function objects each render.
  const _cityClickImpl = useRef(handleCityClick);
  _cityClickImpl.current = handleCityClick;
  const cityLayerRightClick = (cityId: string, e: React.MouseEvent) => {
    if (e.type === "contextmenu") {
      e.preventDefault();
      if (setup || scenario !== "board") return;
      setCityMenu({ cityId, x: e.clientX, y: e.clientY });
    }
  };
  const _cityRightClickImpl = useRef(cityLayerRightClick);
  _cityRightClickImpl.current = cityLayerRightClick;
  const stableOnCityClick = useCallback((cityId: string) => _cityClickImpl.current(cityId), []);
  const stableOnCityRightClick = useCallback((cityId: string, e: React.MouseEvent) => _cityRightClickImpl.current(cityId, e), []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        @keyframes chainPulse {
          from { opacity: 0.55; transform: translate(-50%, -50%) scale(0.88); }
          to   { opacity: 1;    transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>

      {onInfectionDone && (setupRemaining > 0 || setupRemaining === 0) && !setup && (() => {
        const done = setupRemaining === 0;
        const phase = setupRemaining > 6 ? 1 : setupRemaining > 3 ? 2 : 3;
        const cubes = phase === 1 ? 3 : phase === 2 ? 2 : 1;
        const color = done ? "#44bb66" : phase === 1 ? "#ff4444" : phase === 2 ? "#ff8800" : "#ffcc00";
        const drawn = 9 - setupRemaining;
        return (
          <div style={{
            marginBottom: 6, padding: "7px 14px",
            background: "#0d0d0d", border: `1px solid ${color}`,
            borderRadius: 6, color, fontSize: 12,
            fontFamily: "system-ui, sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
          }}>
            {done ? (
              <>
                <span>✓ Initial infection complete</span>
                <button onClick={onInfectionDone} style={{
                  padding: "4px 16px", fontSize: 12, borderRadius: 5, cursor: "pointer",
                  background: "#1a4a2a", border: "1px solid #44bb66", color: "#88ffaa",
                  fontWeight: 700,
                }}>
                  Choose Funding Cards →
                </button>
              </>
            ) : (
              <>
                <span>
                  Initial Infection — click the infection deck &nbsp;·&nbsp;
                  Place <strong>{cubes} cube{cubes > 1 ? "s" : ""}</strong> per city &nbsp;·&nbsp;
                  {drawn}/9 cards drawn
                </span>
              </>
            )}
          </div>
        );
      })()}

      {onChooseRoles && (
        <div style={{
          marginBottom: 6, padding: "8px 16px",
          background: dealComplete ? "#0d1a10" : "#0d1520",
          border: `1px solid ${dealComplete ? "#44bb66" : "#2a5080"}`,
          borderRadius: 6, fontSize: 12, fontFamily: "system-ui, sans-serif",
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          {/* Deal progress per player */}
          <span style={{ color: "#8ab", fontWeight: 600 }}>Deal cards:</span>
          {DEAL_KEYS.map((p, i) => {
            const count = dealCounts[i];
            const isNext = i === maxDealTargetIdx && !dealComplete;
            const isActive = i < activeDealCount || i === maxDealTargetIdx;
            const req = activeDealCount >= 4 ? 2 : activeDealCount === 3 ? 3 : 4;
            const met = count >= req && activeDealCount >= 2;
            return (
              <span key={p} style={{
                padding: "2px 8px", borderRadius: 4,
                background: isNext ? "#1a3a5a" : met ? "#0d2a18" : "#111820",
                border: `1px solid ${isNext ? "#4af" : met ? "#44bb66" : "#2a3a50"}`,
                color: isNext ? "#7bc4ff" : met ? "#88ffaa" : isActive ? "#aac" : "#446",
                fontWeight: isNext ? 700 : 400,
              }}>
                P{i + 1}: {count}{isActive && activeDealCount >= 2 ? `/${req}` : ""}
                {isNext ? " ◄" : ""}
              </span>
            );
          })}
          <button
            disabled={!dealComplete}
            onClick={() => onChooseRoles?.(activeDealCount)}
            style={{
              marginLeft: "auto", padding: "4px 16px", fontSize: 12, borderRadius: 5,
              cursor: dealComplete ? "pointer" : "not-allowed",
              background: dealComplete ? "#1a4a2a" : "#111820",
              border: `1px solid ${dealComplete ? "#44bb66" : "#2a3a50"}`,
              color: dealComplete ? "#88ffaa" : "#446", fontWeight: 700,
              opacity: dealComplete ? 1 : 0.5,
            }}>
            Choose Roles →
          </button>
        </div>
      )}

      {onResumeRoles && (
        <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}>
          <button onClick={onResumeRoles} style={{
            padding: "6px 20px", fontSize: 12, borderRadius: 5, cursor: "pointer",
            background: "#0d1b2e", border: "1px solid #3a6aaa", color: "#7bc4ff",
            fontWeight: 600,
          }}>
            ↩ Resume Role Selection
          </button>
        </div>
      )}

      {epidemicState && (
        <div style={{
          marginBottom: 6, padding: "8px 16px",
          background: "#1a0a00", border: "1px solid #cc6600",
          borderRadius: 6, fontFamily: "system-ui, sans-serif", fontSize: 12,
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        }}>
          <span style={{ color: "#ff9933", fontWeight: 700, fontSize: 14 }}>☣ EPIDEMIC</span>
          {epidemicState.phase === 'infect' ? (
            <span style={{ color: "#cc8844" }}>
              Step 2 — <strong>Left-click</strong> the infection deck to draw the bottom card
            </span>
          ) : (
            <>
              {epidemicState.infectedCityId && (() => {
                const city = CITIES.find(c => c.id === epidemicState.infectedCityId);
                const colorHex: Record<string, string> = { black: "#aaa", yellow: "#ffe44d", red: "#ff6666", blue: "#66aaff" };
                return (
                  <span style={{ color: "#ddc" }}>
                    <strong>{city?.name ?? epidemicState.infectedCityId}</strong>&nbsp;infected —&nbsp;
                    <span style={{ color: colorHex[epidemicState.infectedColor ?? ""] }}>
                      +3 {epidemicState.infectedColor}
                    </span>
                  </span>
                );
              })()}
              <span style={{ color: "#cc8844" }}>
                Step 3 — Right-click the <strong>infection discard</strong> → Shuffle to Intensify
              </span>
            </>
          )}
        </div>
      )}

      {outbreakQueue.length > 0 && (
        <div style={{
          marginBottom: 6, padding: "6px 14px",
          background: "#2a0808", border: "1px solid #dc3d3d",
          borderRadius: 6, color: "#ff8080", fontSize: 12,
          fontFamily: "system-ui, sans-serif", textAlign: "center",
        }}>
          ⚠ Chain Reaction — left-click each glowing city to place 1 cube &nbsp;({outbreakQueue.length} remaining)
        </div>
      )}

      {/* Turn Panel — shown during game phase */}
      {setup && (
        <TurnPanel
          setup={setup}
          turnState={turnState}
          playerColors={playerColors}
          currentPlayerKey={currentPlayerKey}
          infectionPos={infectionPos}
          cureSelecting={cureSelecting}
          selectedHandCards={selectedHandCards}
          cured={cured}
          roleId={roleId}

          quietNight={quietNight}
          eventMode={eventMode}
          handCards={handCards}
          cureThreshold={cureThreshold}
          cubeSnapshotRef={cubeSnapshotRef}
          currentPlayerHand={currentPlayerHand}
          saveHandCards={saveHandCards}
          setPlayerDiscard={setPlayerDiscard}
          setCured={setCured}
          setCureSelecting={setCureSelecting}
          setSelectedHandCards={setSelectedHandCards}
          saveTurnState={saveTurnState}
          consumeAction={consumeAction}
          advanceTurn={advanceTurn}
          setQuietNight={setQuietNight}
          saveCityInfection={saveCityInfection}
          setEventMode={setEventMode}
          setHighlightCities={setHighlightCities}
          setAirliftPawn={setAirliftPawn}
          setFlexibleAidSelected={setFlexibleAidSelected}
          setEventModeRemaining={setEventModeRemaining}
          setPendingEventCard={setPendingEventCard}
          setShowDiscardPopup={setShowDiscardPopup}
        />
      )}

      {setup && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4, gap: 6 }}>
          {undoSnapshot && turnState.phase === "actions" && (
            <button onClick={restoreUndoSnapshot}
              style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#1a2a1a", border: "1px solid #446644", color: "#88cc88" }}>
              ↩ Undo
            </button>
          )}
          {confirmGiveUp ? (
            <>
              <span style={{ fontSize: 11, color: "#cc8888", alignSelf: "center", marginRight: 8 }}>Give up and lose this game?</span>
              <button onClick={() => { setGaveUp(true); setConfirmGiveUp(false); setDismissedResult(null); }}
                style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#3a1a1a", border: "1px solid #aa3333", color: "#ff8888", marginRight: 4 }}>
                Yes, Give Up
              </button>
              <button onClick={() => setConfirmGiveUp(false)}
                style={{ padding: "3px 8px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#1a1a1a", border: "1px solid #555", color: "#888" }}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmGiveUp(true)}
              style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#1a1a1a", border: "1px solid #553333", color: "#aa6666" }}>
              Give Up
            </button>
          )}
        </div>
      )}

      {(eventMode || quietNight) && (
        <div style={{ textAlign: "center", fontSize: 11, fontFamily: "monospace", marginBottom: 4, color: "#aac" }}>
          {quietNight && turnState.phase === "infect" ? "One Quiet Night active"
            : eventMode === 'govt-grant' ? "Government Grant — click a city"
            : eventMode === 'remote-treatment' ? `Remote Treatment — right-click a cube (${eventModeRemaining} left)`
            : eventMode === 'airlift' ? "Airlift — drag a pawn to any city"
            : eventMode === 'resilient-pop' ? "Resilient Population — click a card in the popup to remove it from the game"
            : eventMode === 'flexible-aid' ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {`Flexible Aid — drag any card to the graveyard (${flexibleAidSelected.length}/3 selected)`}
                {flexibleAidSelected.length >= 1 && (
                  <button onClick={() => {
                    const count = flexibleAidSelected.length;
                    setTurnState_(prev => {
                      const base = { ...prev, actionsRemaining: prev.actionsRemaining + count };
                      const next = (prev.phase === 'draw' && prev.drawCount === 0) ? { ...base, phase: 'actions' as const } : base;
                      localStorage.setItem(LS_TURN, JSON.stringify(next)); return next;
                    });
                    setEventMode(null); setFlexibleAidSelected([]);
                  }} style={{ padding: "2px 8px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#1a3a1a", border: "1px solid #4a9a4a", color: "#88dd88" }}>
                    OK (+{flexibleAidSelected.length})
                  </button>
                )}
              </span>
            )
            : null}
        </div>
      )}
      <div style={{ marginBottom: 10, textAlign: "center" }}>
        <span style={{
          fontSize: 22, fontWeight: 700, letterSpacing: 3,
          color: "#c8ddf7", fontFamily: "system-ui, sans-serif",
          textTransform: "uppercase", textShadow: "0 0 18px #3af8",
        }}>
          {SCENARIO_LABELS[scenario] ?? scenario}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#556", fontFamily: "monospace" }}>build 2025-06-11j</span>
        <button onClick={() => setCalibrating(v => !v)}>
          {calibrating ? "Done calibrating" : "Calibrate markers"}
        </button>
        <button onClick={() => {
          if (window.confirm("Reset all game state?")) {
            clearGameState();
            localStorage.removeItem(LS_CODA_COLOR);
            localStorage.removeItem(LS_PANIC_LEVELS);
            localStorage.removeItem(LS_DISEASE_NAMES);
            onMainMenu?.();
            window.location.reload();
          }
        }} style={{ background: "#2a1a1a", border: "1px solid #664444", color: "#cc8888" }}>
          Reset
        </button>
        {calibrating && (
          <>
            <button onClick={() => {
              const text = [
                `token p1: { x: ${tokenP1.x.toFixed(2)}, y: ${tokenP1.y.toFixed(2)}, w: ${tokenP1.w.toFixed(2)} }`,
                `token p2: { x: ${tokenP2.x.toFixed(2)}, y: ${tokenP2.y.toFixed(2)}, w: ${tokenP2.w.toFixed(2)} }`,
              ].join("\n");
              navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => window.prompt("Tokens", text));
            }}>Copy tokens</button>
            <button onClick={() => {
              MARKERS.forEach((m, i) => {
                setStates(prev => { const next = [...prev]; next[i] = m.def; return next; });
                localStorage.removeItem(m.key);
              });
            }}>Reset markers to default</button>
            <span style={{ color: "#9ab", fontSize: 12, alignSelf: "center" }}>Drag to move · drag ↘ corner to resize</span>
          </>
        )}
      </div>

      <div
        ref={boardRef}
        onClick={handleBoardClick}
        onContextMenu={e => e.preventDefault()}
        onDragStart={e => e.preventDefault()}
        style={{
          position: "relative",
          width: "100%",
          userSelect: "none",
          aspectRatio: "918 / 568",
          borderRadius: 6,
          cursor: calibrating ? "grab" : "default",
        }}
      >
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 6 }}>
          <img
            src={boardArt}
            alt="Epidemic board"
            draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", userSelect: "none", pointerEvents: "none" }}
          />
        </div>
        {/* January: after 2nd epidemic — disease sticker on cube tray + COdA-403a label on cure vial box */}
        {isJan && codaColor !== null && (() => {
          const meta = _SUPPLY_META.find(m => m.color === codaColor);
          if (!meta) return null;
          const ci = COLOR_TO_CURE_IDX[codaColor];
          // Cure marker def positions: CURE_INDICES maps ci → MARKERS index
          const cureMarker = MARKERS[CURE_INDICES[ci]];
          return (
            <>
              {/* Disease sticker at top of the disease cube tray */}
              <img
                src={janDiseaseStickerSrc}
                alt="COdA-403a disease sticker"
                draggable={false}
                style={{
                  position: "absolute",
                  left: `${meta.iconX}%`,
                  top: `${meta.iconY - 5.5}%`,
                  width: "4%",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                  userSelect: "none",
                  zIndex: 5,
                }}
              />
              {/* COdA-403a label in the white cure vial box */}
              <div style={{
                position: "absolute",
                left: `${cureMarker.def.x}%`,
                top: `${cureMarker.def.y}%`,
                transform: "translate(-50%, -50%)",
                fontSize: "0.55vw",
                fontWeight: 700,
                color: "#1a1a1a",
                fontFamily: "monospace",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 5,
              }}>
                COdA-403a
              </div>
            </>
          );
        })()}

        {/* Disease supply piles — static scattered positions, front cubes hidden as placed */}
        {SUPPLY_PILES.flatMap(({ color, src }, ci) => {
          const remaining = 24 - Math.min(24, placedPerColor[ci]);
          const pile = SUPPLY_PILES[ci].positions;
          return [
            <img key={`supply-icon-${color}`} src={src} alt={color} draggable={false} style={{
              position: "absolute",
              left: `${SUPPLY_PILES[ci].iconX}%`, top: `${SUPPLY_PILES[ci].iconY}%`,
              transform: "translate(-50%, -50%)",
              width: "5%", height: "5%",
              objectFit: "contain",
              pointerEvents: "none",
              zIndex: 4,
            }} />,
            ...pile.slice(0, remaining).map((pos, i) => (
              <div key={`supply-cube-${color}-${i}`} style={{
                position: "absolute",
                left: `${pos.x}%`, top: `${pos.y}%`,
                width: `${CUBE_W}%`, aspectRatio: "1",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 4 + i,
              }}>
                <img src={COLOR_TO_CUBE_IMG[color]} alt={`${color} cube`} draggable={false}
                  style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }} />
              </div>
            )),
          ];
        })}

        <CityLayer
          roadblocks={roadblocks}
          onRoadblockChange={rb => { setRoadblocks(rb); saveRoadblocks(rb); }}
          onCityClick={calibrating ? undefined : stableOnCityClick}
          onCityRightClick={calibrating ? undefined : stableOnCityRightClick}
          highlightCities={highlightCities.length > 0 ? highlightCities : undefined}
        />

        {/* City infection cubes — multi-color, up to 3 per color */}
        {(() => {
          const hx = CUBE_W * 0.34;
          const sy = CUBE_W * BOARD_RATIO * 0.36;
          const LAYOUTS: [number, number][][] = [
            [[0, 0]],
            [[-hx, 0], [hx, 0]],
            [[-hx, 0], [hx, 0], [0, -sy]],
          ];
          return CITIES.flatMap(c => {
            const cityColors = DISEASE_COLORS.filter(col => (cityInfection[c.id]?.[col] ?? 0) > 0);
            if (cityColors.length === 0) return [];
            // Offset each color group along x so they don't overlap
            const groupSpacing = CUBE_W * 1.15;
            const totalW = (cityColors.length - 1) * groupSpacing;
            return cityColors.flatMap((col, gi) => {
              const count = cityInfection[c.id]![col]!;
              const cubeColor = COLOR_TO_CUBE[col];
              const gx = -totalW / 2 + gi * groupSpacing;
              return LAYOUTS[count - 1].map(([dx, dy], i) => (
                <div key={`${c.id}-${col}-${i}`}
                  onClick={e => { e.stopPropagation(); if (!onChooseRoles) handleCityClick(c.id); }}
                  onContextMenu={e => {
                    e.preventDefault(); e.stopPropagation();
                    if (!onChooseRoles) handleCityRightClick(c.id, col as DiseaseColor);
                  }}
                  style={{
                    position: "absolute",
                    left: `${c.pos.x + dx + gx}%`,
                    top: `calc(${c.pos.y + dy}% - 15px)`,
                    width: `${CUBE_W}%`, aspectRatio: "1",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "auto",
                    cursor: "context-menu",
                    zIndex: 12 + i,
                  }}>
                  <CubeSvg color={cubeColor} />
                </div>
              ));
            });
          });
        })()}

        {/* Infection deck ghost — always-present right-click target even when deck is empty */}
        {/* During gameplay only allow right-click when epidemic infect step is pending */}
        <div
          onContextMenu={e => {
            e.preventDefault(); e.stopPropagation();
            if (setup) return; // right-click menu only in sandbox mode
            setDeckMenu({ x: e.clientX, y: e.clientY });
          }}
          style={{
            position: "absolute",
            left: `${cardInfection.x}%`, top: `${cardInfection.y}%`,
            width: `${cardInfection.w}%`, aspectRatio: "2.5/3.5",
            transform: "translate(-50%, -50%)",
            zIndex: 8,
            cursor: "context-menu",
          }}
        />

        {/* Infection draw pile — stacked visual */}
        {(() => {
          const card = cardInfection;
          const save = (c: CardState) => { setCardInfection(c); localStorage.setItem(LS_CARD_INFECTION, JSON.stringify(c)); };
          const layers = Math.max(0, Math.min(infectDeck.length, 10));
          const step = 0.10;
          const onDragDown = calibrating ? (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation(); e.preventDefault();
            const el = e.currentTarget; el.setPointerCapture(e.pointerId);
            const r = boardRef.current!.getBoundingClientRect();
            const sx = e.clientX; const sy = e.clientY; const ox = card.x; const oy = card.y;
            const onMove = (ev: PointerEvent) => save({ ...card, x: ox + ((ev.clientX - sx) / r.width) * 100, y: oy + ((ev.clientY - sy) / r.height) * 100 });
            const onUp = () => { el.removeEventListener("pointermove", onMove as any); el.removeEventListener("pointerup", onUp); };
            el.addEventListener("pointermove", onMove as any); el.addEventListener("pointerup", onUp);
          } : undefined;
          const onResizeDown = calibrating ? (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation(); e.preventDefault();
            const el = e.currentTarget; el.setPointerCapture(e.pointerId);
            const r = boardRef.current!.getBoundingClientRect();
            const sx = e.clientX; const ow = card.w;
            const onMove = (ev: PointerEvent) => save({ ...card, w: Math.max(2, ow + ((ev.clientX - sx) / r.width) * 100) });
            const onUp = () => { el.removeEventListener("pointermove", onMove as any); el.removeEventListener("pointerup", onUp); };
            el.addEventListener("pointermove", onMove as any); el.addEventListener("pointerup", onUp);
          } : undefined;
          return Array.from({ length: layers }, (_, i) => {
            const isTop = i === layers - 1;
            const offset = i * step;
            return (
              <div key={`inf-deck-${i}`}
                onPointerDown={isTop ? onDragDown : undefined}
                onClick={isTop && !calibrating && !onChooseRoles ? (() => {
                  // Epidemic infect phase: left-click draws bottom card
                  if (epidemicState?.phase === 'infect') {
                    if (infectDeck.length === 0) return;
                    const bottom = infectDeck[0];
                    setInfectDeck(infectDeck.slice(1));
                    setInfectDiscard(prev => [...prev, bottom]);
                    epidemicInfect(bottom);
                    return;
                  }
                  // Normal infect phase or initial setup
                  if (!setup ? setupRemaining > 0 : turnState.phase === "infect") drawInfectionCard();
                }) : undefined}
                onContextMenu={isTop && !calibrating && !setup ? (e) => { e.preventDefault(); setDeckMenu({ x: e.clientX, y: e.clientY }); } : undefined}
                style={{
                  position: "absolute",
                  left: `${card.x + offset}%`, top: `${card.y - offset * BOARD_RATIO}%`,
                  width: `${card.w}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 9 + i,
                  cursor: calibrating && isTop ? "grab" : isTop ? "pointer" : "default",
                  outline: calibrating && isTop ? "2px dashed #fff" : "none",
                  boxSizing: "border-box",
                  boxShadow: isTop && setupRemaining > 0
                    ? `0 0 0 2px ${setupRemaining > 6 ? "#ff3333" : setupRemaining > 3 ? "#ff8800" : "#ffcc00"}, 0 0 16px 4px ${setupRemaining > 6 ? "#ff333388" : setupRemaining > 3 ? "#ff880088" : "#ffcc0088"}`
                    : isTop && epidemicState?.phase === 'infect'
                    ? "0 0 0 2px #ff9933, 0 0 16px 4px #ff993366"
                    : "none",
                  borderRadius: (isTop && setupRemaining > 0) || (isTop && epidemicState?.phase === 'infect') ? 4 : 0,
                }}>
                <img src={infectionCardBackSrc} alt="" draggable={false}
                  style={{ width: "100%", height: "auto", display: "block", userSelect: "none", pointerEvents: "none" }} />
                {calibrating && isTop && (
                  <div onPointerDown={onResizeDown}
                    style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, background: "#fff", cursor: "se-resize" }} />
                )}
              </div>
            );
          });
        })()}

        {/* Debug: epidemic count + click to see full deck */}
        {boardPxW > 0 && (() => {
          const embeddedEps = playerDeck.filter(id => id === "epidemic").length;
          const totalEps = embeddedEps + epidemicCount;
          return (
            <>
              <div
                onClick={() => setShowDebugDeck(prev => !prev)}
                style={{
                  position: "absolute",
                  left: `${cardPlayer.x}%`, top: `${cardPlayer.y - cardPlayer.w * BOARD_RATIO * 0.8}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 30,
                  fontSize: 10, color: "#ffcc44", fontFamily: "system-ui, sans-serif",
                  whiteSpace: "nowrap", textAlign: "center",
                  cursor: "pointer", userSelect: "none",
                }}>
                {`epidemics: ${totalEps} · ${playerDeck.length} cards [click]`}
              </div>
              {showDebugDeck && (
                <div
                  onClick={() => setShowDebugDeck(false)}
                  style={{
                    position: "absolute",
                    left: `${cardPlayer.x}%`, top: `${cardPlayer.y + cardPlayer.w * BOARD_RATIO}%`,
                    transform: "translateX(-50%)",
                    zIndex: 9999,
                    background: "#0a1520ee",
                    border: "1px solid #ffcc44",
                    borderRadius: 6, padding: "6px 10px",
                    fontFamily: "system-ui, sans-serif", fontSize: 10,
                    color: "#ddd", maxHeight: "30vh", overflowY: "auto",
                    cursor: "pointer", minWidth: 120,
                  }}>
                  <div style={{ color: "#ffcc44", fontWeight: 700, marginBottom: 4 }}>
                    Player Deck (top → bottom)
                  </div>
                  {[...playerDeck].reverse().map((id, i) => {
                    const city = CITIES.find(c => c.id === id);
                    const isEp = id === "epidemic";
                    const FUND_NAMES: Record<string, string> = {
                      fund1: 'One Quiet Night', fund2: 'Remote Treatment',
                      fund3: 'Government Grant', fund4: 'Resilient Population',
                      fund5: 'Forecast', fund6: 'Airlift',
                      fund7: 'Borrowed Time', fund8: 'Flexible Aid',
                    };
                    const label = isEp ? "☣ EPIDEMIC" : (city?.name ?? FUND_NAMES[id] ?? id);
                    const color = isEp ? "#ff6644" : FUND_NAMES[id] ? "#aaddff" : "#ccc";
                    return (
                      <div key={i} style={{ color, lineHeight: 1.5 }}>
                        {i + 1}. {label}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* Player deck ghost — always-present right-click target even when deck is empty */}
        <div
          onContextMenu={e => { e.preventDefault(); e.stopPropagation(); if (setup) return; setPlayerDeckMenu({ x: e.clientX, y: e.clientY }); }}
          style={{
            position: "absolute",
            left: `${cardPlayer.x}%`, top: `${cardPlayer.y}%`,
            width: `${cardPlayer.w}%`, aspectRatio: "2.5/3.5",
            transform: "translate(-50%, -50%)",
            zIndex: 8,
            cursor: "context-menu",
          }}
        />

        {/* Player draw pile — stacked face-down */}
        {(() => {
          const card = cardPlayer;
          const save = (c: CardState) => { setCardPlayer(c); localStorage.setItem(LS_CARD_PLAYER, JSON.stringify(c)); };
          const layers = Math.max(0, Math.min(playerDeck.length, 10));
          const step = 0.10;
          const onDragDown = calibrating ? (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation(); e.preventDefault();
            const el = e.currentTarget; el.setPointerCapture(e.pointerId);
            const r = boardRef.current!.getBoundingClientRect();
            const sx = e.clientX; const sy = e.clientY; const ox = card.x; const oy = card.y;
            const onMove = (ev: PointerEvent) => save({ ...card, x: ox + ((ev.clientX - sx) / r.width) * 100, y: oy + ((ev.clientY - sy) / r.height) * 100 });
            const onUp = () => { el.removeEventListener("pointermove", onMove as any); el.removeEventListener("pointerup", onUp); };
            el.addEventListener("pointermove", onMove as any); el.addEventListener("pointerup", onUp);
          } : undefined;
          const onResizeDown = calibrating ? (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation(); e.preventDefault();
            const el = e.currentTarget; el.setPointerCapture(e.pointerId);
            const r = boardRef.current!.getBoundingClientRect();
            const sx = e.clientX; const ow = card.w;
            const onMove = (ev: PointerEvent) => save({ ...card, w: Math.max(2, ow + ((ev.clientX - sx) / r.width) * 100) });
            const onUp = () => { el.removeEventListener("pointermove", onMove as any); el.removeEventListener("pointerup", onUp); };
            el.addEventListener("pointermove", onMove as any); el.addEventListener("pointerup", onUp);
          } : undefined;
          return Array.from({ length: layers }, (_, i) => {
            const isTop = i === layers - 1;
            const offset = i * step;
            const cityId = playerDeck[playerDeck.length - layers + i];
            const isEpidemic = cityId === "epidemic";
            const isFunding = FUND_IMGS[cityId] !== undefined;
            const city = (isEpidemic || isFunding) ? null : CITIES.find(c => c.id === cityId);
            const faceUp = isTop && playerFlipped.has(cityId);
            const pxW = boardPxW > 0 ? (card.w / 100) * boardPxW : 0;

            const canDrawPlayer = isTop && !calibrating && !epidemicState && (
              (!!setup && turnState.phase === "draw") ||          // in-game draw phase
              !!onChooseRoles ||                                   // deal phase
              (!setup && !onChooseRoles && setupRemaining === 0)  // post-infection sandbox
            );
            const onTopDown = canDrawPlayer
              ? makePlayerDeckDraw({
                  boardRef, playerDeck, playerDiscard, cardPlayerDiscard, setup, turnState,
                  handCards, currentPlayerKey, onChooseRoles, maxDealTargetIdx, dealRequiredCards, dealCounts,
                  setPlayerDrag, setPlayerDeck, setPlayerDiscard, setPlayerFlipped,
                  saveTurnState, saveHandCards,
                  onFlip: (id) => {
                    const PL_STEP = 0.10;
                    const plLayers = Math.max(0, Math.min(playerDeck.length, 10));
                    const plOffset = (plLayers - 1) * PL_STEP;
                    setFlippingPlayerCard({ cityId: id, x: cardPlayer.x + plOffset, y: cardPlayer.y - plOffset * BOARD_RATIO });
                    setTimeout(() => setFlippingPlayerCard(null), 550);
                    if (id === "epidemic") triggerEpidemic();
                  },
                  onEpidemic: triggerEpidemic,
                  onUnflip: (id) => {
                    const PL_STEP = 0.10;
                    const plLayers = Math.max(0, Math.min(playerDeck.length, 10));
                    const plOffset = (plLayers - 1) * PL_STEP;
                    setFlippingPlayerCard({ cityId: id, x: cardPlayer.x + plOffset, y: cardPlayer.y - plOffset * BOARD_RATIO, reverse: true });
                    setTimeout(() => {
                      setFlippingPlayerCard(null);
                      setPlayerFlipped(prev => { const n = new Set(prev); n.delete(id); return n; });
                    }, 550);
                  },
                }, cityId, faceUp)
              : (isTop ? onDragDown : undefined);

            return (
              <div key={`player-deck-${i}`}
                onPointerDown={onTopDown}
                onContextMenu={isTop && !calibrating && !setup ? e => { e.preventDefault(); e.stopPropagation(); setPlayerDeckMenu({ x: e.clientX, y: e.clientY }); } : undefined}
                style={{
                  position: "absolute",
                  left: `${card.x + offset}%`, top: `${card.y - offset * BOARD_RATIO}%`,
                  width: `${card.w}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 9 + i,
                  cursor: isTop && !calibrating ? "grab" : calibrating && isTop ? "grab" : "default",
                  outline: calibrating && isTop ? "2px dashed #fff" : "none",
                  boxSizing: "border-box",
                  opacity: playerDrag?.cityId === cityId ? 0.35 : 1,
                }}>
                {/* Hide top card while stationary flip animation is playing */}
                {!(isTop && flippingPlayerCard?.cityId === cityId) && (
                  faceUp && pxW > 0
                    ? (isEpidemic
                        ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden" }}><img src={epidemicCardSrc} alt="Epidemic" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block", pointerEvents: "none" }} /></div>
                        : isFunding
                        ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden" }}><img src={FUND_IMGS[cityId]} draggable={false} style={{ width: "100%", height: "100%", objectFit: "fill", display: "block", pointerEvents: "none" }} /></div>
                        : <PlayerCard city={city!} width={pxW} />)
                    : <img src={playerCardBackSrc} alt="" draggable={false}
                        style={{ width: "100%", height: "auto", display: "block", userSelect: "none", pointerEvents: "none" }} />
                )}
                {calibrating && isTop && (
                  <div onPointerDown={onResizeDown}
                    style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, background: "#fff", cursor: "se-resize" }} />
                )}
              </div>
            );
          });
        })()}

        {/* Player discard pile — fanned face-up */}
        {playerDiscard.length > 0 && boardPxW > 0 && (() => {
          const card = cardPlayerDiscard;
          const pxW = (card.w / 100) * boardPxW;
          const step = 0.10;
          const layers = Math.min(playerDiscard.length, 10);
          const visible = playerDiscard.slice(-layers);
          return visible.map((cid, i) => {
            const isEpidemic = cid === "epidemic";
            const isFunding = FUND_IMGS[cid] !== undefined;
            const city = (isEpidemic || isFunding) ? null : CITIES.find(c => c.id === cid);
            if (!city && !isEpidemic && !isFunding) return null;
            const offset = i * step;
            const isTop = i === layers - 1;
            return (
              <div key={`player-discard-${i}`}
                onClick={isTop ? () => setShowPlayerDiscardPopup(v => !v) : undefined}
                style={{
                  position: "absolute",
                  left: `${card.x + offset}%`, top: `${card.y - offset * BOARD_RATIO}%`,
                  width: `${card.w}%`, transform: "translate(-50%, -50%)",
                  zIndex: 11 + i, boxSizing: "border-box",
                  cursor: isTop ? "pointer" : "default",
                }}>
                {city
                  ? <PlayerCard city={city} width={pxW} />
                  : isFunding
                  ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden", position: "relative" }}><img src={FUND_IMGS[cid]} draggable={false} style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block", pointerEvents: "none" }} /></div>
                  : <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden" }}><img src={epidemicCardSrc} alt="Epidemic" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block", pointerEvents: "none" }} /></div>
                }
              </div>
            );
          });
        })()}

        {/* Floating player card during drag */}
        {playerDrag && boardPxW > 0 && (() => {
          const isDragEpidemic = playerDrag.cityId === "epidemic";
          const isDragFunding = FUND_IMGS[playerDrag.cityId] !== undefined;
          const isDragFaceUp = playerFlipped.has(playerDrag.cityId);
          const city = (isDragEpidemic || isDragFunding) ? null : CITIES.find(c => c.id === playerDrag.cityId);
          if (!city && !isDragEpidemic && !isDragFunding) return null;
          const pxW = (cardPlayer.w / 100) * boardPxW;
          return (
            <div style={{
              position: "absolute",
              left: `${playerDrag.x}%`, top: `${playerDrag.y}%`,
              width: `${cardPlayer.w}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 200, pointerEvents: "none",
              filter: "drop-shadow(0 6px 20px #000e)",
            }}>
              {!isDragFaceUp
                ? <img src={playerCardBackSrc} alt="" draggable={false} style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }} />
                : isDragEpidemic
                ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden" }}><img src={epidemicCardSrc} alt="Epidemic" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block", pointerEvents: "none" }} /></div>
                : isDragFunding
                ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden", position: "relative" }}><img src={FUND_IMGS[playerDrag.cityId]} draggable={false} style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block", pointerEvents: "none" }} /></div>
                : <PlayerCard city={city!} width={pxW} />
              }
            </div>
          );
        })()}

        {/* Infection discard ghost — always-present right-click target even when discard is empty */}
        <div
          onContextMenu={e => { e.preventDefault(); e.stopPropagation(); if (setup && epidemicState?.phase !== 'intensify') return; setDiscardMenu({ x: e.clientX, y: e.clientY }); }}
          style={{
            position: "absolute",
            left: `${cardInfectionDiscard.x}%`, top: `${cardInfectionDiscard.y}%`,
            width: `${cardInfectionDiscard.w}%`, aspectRatio: "2.5/3.5",
            transform: "translate(-50%, -50%)",
            zIndex: 8,
            cursor: "context-menu",
          }}
        />

        {/* Infection discard pile — fanned face up */}
        {infectDiscard.length > 0 && boardPxW > 0 && (() => {
          const card = cardInfectionDiscard;
          const pxW = (card.w / 100) * boardPxW;
          const step = 0.10;
          const layers = Math.min(infectDiscard.length, 10);
          // Show last `layers` cards; index 0 = oldest visible (base), last = top
          const visible = infectDiscard.slice(-layers);
          return visible.map((cityId, i) => {
            const city = CITIES.find(c => c.id === cityId);
            if (!city) return null;
            const offset = i * step;
            const isTop = i === layers - 1;
            const onDragDown = calibrating && isTop ? (e: React.PointerEvent<HTMLDivElement>) => {
              e.stopPropagation(); e.preventDefault();
              const el = e.currentTarget; el.setPointerCapture(e.pointerId);
              const r = boardRef.current!.getBoundingClientRect();
              const sx = e.clientX; const sy = e.clientY; const ox = card.x; const oy = card.y;
              const save = (c: CardState) => { setCardInfectionDiscard(c); localStorage.setItem(LS_CARD_INFECTION_DISCARD, JSON.stringify(c)); };
              const onMove = (ev: PointerEvent) => save({ ...card, x: ox + ((ev.clientX - sx) / r.width) * 100, y: oy + ((ev.clientY - sy) / r.height) * 100 });
              const onUp = () => { el.removeEventListener("pointermove", onMove as any); el.removeEventListener("pointerup", onUp); };
              el.addEventListener("pointermove", onMove as any); el.addEventListener("pointerup", onUp);
            } : undefined;
            return (
              <div key={`inf-discard-${i}`}
                onPointerDown={onDragDown}
                onClick={isTop && !calibrating ? () => {
                  setShowDiscardPopup(true);
                } : undefined}
                onContextMenu={isTop && !calibrating ? (e) => { e.preventDefault(); if (setup && epidemicState?.phase !== 'intensify') return; setDiscardMenu({ x: e.clientX, y: e.clientY }); } : undefined}
                style={{
                  position: "absolute",
                  left: `${card.x + offset}%`, top: `${card.y - offset * BOARD_RATIO}%`,
                  width: `${card.w}%`, transform: "translate(-50%, -50%)",
                  cursor: calibrating && isTop ? "grab" : isTop ? "pointer" : "default",
                  zIndex: 11 + i,
                  outline: calibrating && isTop ? "2px dashed #fff" : "none",
                  boxSizing: "border-box",
                  boxShadow: isTop && epidemicState ? "0 0 0 2px #ff9933, 0 0 16px 4px #ff993366" : "none",
                  borderRadius: isTop && epidemicState ? 4 : 0,
                }}>
                {/* Hide top card while fly+flip animation is playing */}
                {!(isTop && flippingInfCard?.cityId === city.id) && (
                  <InfectionCard city={city} width={pxW} />
                )}
              </div>
            );
          });
        })()}

        {/* Infection card fly+flip overlay */}
        {flippingInfCard && boardPxW > 0 && (() => {
          const city = CITIES.find(c => c.id === flippingInfCard.cityId);
          const pxW = (cardInfectionDiscard.w / 100) * boardPxW;
          if (!city || pxW <= 0) return null;
          return (
            <FlyFlipCard
              key={flippingInfCard.cityId + Date.now()}
              fromX={flippingInfCard.fromX} fromY={flippingInfCard.fromY}
              toX={flippingInfCard.toX} toY={flippingInfCard.toY}
              cardW={pxW} cardH={pxW * (2.5 / 3.5)}
              backSrc={infectionCardBackSrc}
              front={<InfectionCard city={city} width={pxW} />}
              boardW={boardPxW} boardH={boardPxW / BOARD_RATIO}
              duration={600}
              onComplete={() => setFlippingInfCard(null)}
            />
          );
        })()}

        {/* Infection shuffle animation overlay */}
        {isShufflingInfection && boardPxW > 0 && (
          <ShuffleAnimation
            discardPos={cardInfectionDiscard}
            deckPos={cardInfection}
            cardSrc={infectionCardBackSrc}
            count={infectDiscard.length}
            boardW={boardPxW}
            boardH={boardPxW / BOARD_RATIO}
            duration={800}
            onComplete={() => setIsShufflingInfection(false)}
          />
        )}

        {/* Player card stationary flip overlay */}
        {flippingPlayerCard && boardPxW > 0 && (() => {
          const pxW = (cardPlayer.w / 100) * boardPxW;
          const pxH = pxW * (3.5 / 2.5);
          const city = CITIES.find(c => c.id === flippingPlayerCard.cityId);
          if (pxW <= 0) return null;
          const front = city
            ? <PlayerCard city={city} width={pxW} />
            : <img src={flippingPlayerCard.cityId === "epidemic" ? epidemicCardSrc : playerCardBackSrc}
                draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
          return (
            <div key={flippingPlayerCard.cityId + Date.now()} style={{
              position: "absolute",
              left: `${flippingPlayerCard.x}%`, top: `${flippingPlayerCard.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 9999, pointerEvents: "none",
            }}>
              <CardFlip
                front={front}
                backSrc={playerCardBackSrc}
                width={pxW} height={pxH}
                duration={500}
                reverse={flippingPlayerCard.reverse}
                onComplete={() => {/* timing handled by setTimeout in onFlip/onUnflip */}}
              />
            </div>
          );
        })()}

        {/* Player deck shuffle animation overlay */}
        {isShufflingPlayer && boardPxW > 0 && (
          <ShuffleAnimation
            discardPos={cardPlayerDiscard}
            deckPos={cardPlayer}
            cardSrc={playerCardBackSrc}
            count={Math.min(playerDiscard.length + handCards.p1.length + handCards.p2.length + handCards.p3.length + handCards.p4.length, 8)}
            boardW={boardPxW}
            boardH={boardPxW / BOARD_RATIO}
            duration={800}
            onComplete={() => setIsShufflingPlayer(false)}
          />
        )}

        {/* Player hand areas — always visible in deal phase, dashed in calibrate mode */}
        {(calibrating || !!onChooseRoles) && (['p1', 'p2', 'p3', 'p4'] as const).map(player => {
          const area = player === 'p1' ? HAND_P1 : player === 'p2' ? HAND_P2 : player === 'p3' ? HAND_P3 : HAND_P4;
          const label = player === 'p1' ? 'Player 1' : player === 'p2' ? 'Player 2' : player === 'p3' ? 'Player 3' : 'Player 4';
          const hasCards = ((handCards as Record<string,string[]>)[player]?.length ?? 0) > 0;
          return (
            <div key={player} style={{
              position: "absolute",
              left: `${area.x}%`, top: `${area.y}%`,
              width: `${area.w}%`, height: `${area.h}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 6, boxSizing: "border-box",
              border: hasCards ? "1px solid #4af6" : "1px dashed #4af4",
              display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 4,
              pointerEvents: "none",
            }}>
              <span style={{ color: hasCards ? "#4af" : "#4af7", fontSize: 10, fontFamily: "monospace", userSelect: "none" }}>{label}</span>
            </div>
          );
        })}

        {/* Panic trays — one per city, visible in calibrate mode; only HCMC is draggable */}
        {calibrating && CITIES.map(city => {
          const isHcmc = city.id === "ho-chi-minh-city";
          const t = isHcmc ? hcmcTray : (PANIC_TRAY_POS[city.id] ?? { x: city.pos.x, y: city.pos.y });
          const onDragDown = isHcmc ? (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation(); e.preventDefault();
            const el = e.currentTarget; el.setPointerCapture(e.pointerId);
            const r = boardRef.current!.getBoundingClientRect();
            const sx = e.clientX; const sy = e.clientY; const ox = t.x; const oy = t.y;
            const onMove = (ev: PointerEvent) => {
              const nx = +(ox + ((ev.clientX - sx) / r.width) * 100).toFixed(2);
              const ny = +(oy + ((ev.clientY - sy) / r.height) * 100).toFixed(2);
              setHcmcTray({ x: nx, y: ny });
              localStorage.setItem(LS_HCMC_TRAY, JSON.stringify({ x: nx, y: ny }));
            };
            const onUp = () => { el.removeEventListener("pointermove", onMove as any); el.removeEventListener("pointerup", onUp); };
            el.addEventListener("pointermove", onMove as any); el.addEventListener("pointerup", onUp);
          } : undefined;
          return (
            <div key={`ptray-${city.id}`}
              onPointerDown={onDragDown}
              style={{
                position: "absolute",
                left: `${t.x}%`, top: `${t.y}%`,
                width: `${PANIC_W}%`, aspectRatio: "1",
                transform: "translate(-50%, -50%)",
                zIndex: 7,
                cursor: isHcmc ? "grab" : "default",
                border: `1.5px dashed ${isHcmc ? "#f80" : "#f804"}`,
                boxSizing: "border-box",
              }}>
              <span style={{
                position: "absolute", bottom: "100%", left: "50%",
                transform: "translateX(-50%)",
                color: isHcmc ? "#f80" : "#f806",
                fontSize: 5, fontFamily: "monospace", userSelect: "none",
                pointerEvents: "none", whiteSpace: "nowrap", lineHeight: 1.2,
              }}>
                {city.name}
              </span>
            </div>
          );
        })}

        {/* Research station tokens — draggable */}
        {CITIES.filter(c => researchStations.has(c.id)).map(city => {
          const pos = researchPos[city.id] ?? { x: city.pos.x, y: city.pos.y };
          const onDragDown = (e: React.PointerEvent<HTMLDivElement>) => {
            if (calibrating) return;
            e.stopPropagation(); e.preventDefault();
            const el = e.currentTarget; el.setPointerCapture(e.pointerId);
            const r = boardRef.current!.getBoundingClientRect();
            const sx = e.clientX; const sy = e.clientY; const ox = pos.x; const oy = pos.y;
            const onMove = (ev: PointerEvent) => {
              const nx = +(ox + ((ev.clientX - sx) / r.width) * 100).toFixed(2);
              const ny = +(oy + ((ev.clientY - sy) / r.height) * 100).toFixed(2);
              const next = { ...researchPos, [city.id]: { x: nx, y: ny } };
              setResearchPos(next);
              localStorage.setItem(LS_RESEARCH_POS, JSON.stringify(next));
            };
            const onUp = () => { el.removeEventListener("pointermove", onMove as any); el.removeEventListener("pointerup", onUp); };
            el.addEventListener("pointermove", onMove as any); el.addEventListener("pointerup", onUp);
          };
          const isPlayerRS = setup && city.id === currentPlayerCityId && turnState.phase === "actions";
          const rsHand = isPlayerRS ? currentPlayerHand : [];
          const canShuttle = isPlayerRS && researchStations.size > 1;
          const canCure = isPlayerRS && DISEASE_COLORS.some(col => {
            const ci = COLOR_TO_CURE_IDX[col]; if (ci === undefined || cured[ci]) return false;
            return rsHand.filter(id => CITIES.find(c2 => c2.id === id)?.color === col).length >= cureThreshold;
          });
          const rsHasAction = canShuttle || canCure;
          const inFlightMode = turnState.pendingCharter || turnState.pendingShuttle || !!eventMode;
          return (
            <div key={`rs-${city.id}`} onPointerDown={inFlightMode ? undefined : onDragDown}
              onClick={e => {
                // During charter/shuttle/airlift modes, left-click RS counts as clicking its city
                if (inFlightMode) { e.stopPropagation(); handleCityClick(city.id); return; }
                // Otherwise left-click does nothing (cure/shuttle via right-click only)
              }}
              onContextMenu={e => {
                e.preventDefault(); e.stopPropagation();
                if (setup) {
                  // Game phase: right-click opens cure/shuttle menu
                  if (rsHasAction) setRsActionMenu({ cityId: city.id, x: e.clientX, y: e.clientY });
                  return;
                }
                // Pre-game: right-click removes RS
                const next = new Set(researchStations); next.delete(city.id);
                setResearchStations(next);
                localStorage.setItem(LS_RESEARCH_STATIONS, JSON.stringify([...next]));
              }}
              style={{
                position: "absolute",
                left: `${pos.x}%`, top: `${pos.y}%`,
                width: `${RESEARCH_W}%`, aspectRatio: "1",
                transform: "translate(-50%, -50%)",
                zIndex: 20,
                cursor: inFlightMode ? "pointer" : calibrating ? "default" : "grab",
                touchAction: "none", userSelect: "none",
                boxShadow: rsActionMenu?.cityId === city.id ? "0 0 0 2px #ffdd44, 0 0 10px 3px #ffdd4488" : "none",
              }}>
              <img src={researchSrc} alt="Research station" draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "fill", display: "block", pointerEvents: "none" }} />
            </div>
          );
        })}

        {/* Panic level stickers — month 1 onward only */}
        {scenario !== "month0" && CITIES.map(city => {
          const level = panicLevels[city.id] ?? 0;
          if (level === 0) return null;
          const t = city.id === "ho-chi-minh-city" ? hcmcTray : (PANIC_TRAY_POS[city.id] ?? { x: city.pos.x, y: city.pos.y });
          return (
            <div key={`panic-${city.id}`} style={{
              position: "absolute",
              left: `${t.x}%`, top: `${t.y}%`,
              width: `${PANIC_W}%`, aspectRatio: "1",
              transform: "translate(-50%, -50%)",
              zIndex: 9,
              pointerEvents: "none",
            }}>
              <img src={PANIC_LEVEL_SRCS[level]} alt={`Panic ${level}`} draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "fill", display: "block", userSelect: "none" }} />
            </div>
          );
        })}

        {/* Objective cards — fill slots 1..objectiveCount */}
        {OBJECTIVE_SLOTS.slice(0, objectiveCount).map((slot, i) => (
          <div key={`objective-${i}`}
            onContextMenu={!setup ? (e => { e.preventDefault(); e.stopPropagation(); setObjMenu({ x: e.clientX, y: e.clientY, idx: i }); }) : undefined}
            style={{
              position: "absolute",
              left: `${slot.x}%`, top: `${slot.y}%`,
              width: `${slot.w}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 8,
              cursor: setup ? "default" : "context-menu",
            }}>
            <img src={(isJan && codaColor !== null) ? objectiveUpdatedSrc : objectiveSrc} alt="Objective" draggable={false}
              style={{ width: "100%", height: "auto", display: "block", userSelect: "none", pointerEvents: "none" }} />
            {objectiveCompleted[i] && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <span style={{ fontSize: "4vw", color: "#22dd44", textShadow: "0 0 8px #000, 0 0 4px #000", lineHeight: 1 }}>✓</span>
              </div>
            )}
          </div>
        ))}

        {/* Player hand cards — stacked, draggable — always render all 4 slots */}
        {boardPxW > 0 && (['p1','p2','p3','p4'] as const).map(player => {
          const area = player === 'p1' ? HAND_P1 : player === 'p2' ? HAND_P2 : player === 'p3' ? HAND_P3 : HAND_P4;
          const cards = (handCards as Record<string,string[]>)[player] ?? [];
          if (cards.length === 0) return null;
          const areaTop = area.y - area.h / 2;
          const stackOffset = handStackOffset(area, cards.length);
          const pxW = (area.w / 100) * boardPxW;
          return cards.map((cityId, i) => {
            const isFundingHand = FUND_IMGS[cityId] !== undefined;
            const city = (cityId === "epidemic" || isFundingHand) ? null : CITIES.find(c => c.id === cityId);
            if (!city && cityId !== "epidemic" && !isFundingHand) return null;
            const isDragging = handDrag?.player === player && handDrag.idx === i;
            const isSelected = cureSelecting && selectedHandCards.includes(cityId);
            const onCardDown = makeHandCardPointerDown({
              calibrating, setup, currentPlayerKey, currentPlayerCityId, turnState, boardRef,
              handCards, cardPlayerDiscard,
              handAreas: { p1: HAND_P1, p2: HAND_P2, p3: HAND_P3, p4: HAND_P4 },
              activePlayers, cureSelecting, eventMode, pendingEventCard, playerCities,
              handStackOffset, snapPawnToCity, savePlayerCities, saveHandCards,
              saveTurnState, consumeAction, setHandDrag, setHandHover, flexibleAidSelected, setFlexibleAidSelected,
              setSelectedHandCards, setPlayerDiscard, setPendingDiscardMenu,
              canPlayFund: (cardId: string) => {
                if (cardId === 'fund4') return infectDiscard.length > 0;
                if (cardId === 'fund8') return turnState.phase === 'actions' || (turnState.phase === 'draw' && turnState.drawCount === 0) || turnState.phase === 'discard' || turnState.phase === 'discard-action';
                return true;
              },
              onFlexibleAidComplete: () => {
                // Auto-triggered when 3rd card is dragged to graveyard
                setTurnState_(prev => {
                  const count = flexibleAidSelected.length + 1; // +1 because state hasn't updated yet
                  const base = { ...prev, actionsRemaining: prev.actionsRemaining + count };
                  const next = (prev.phase === 'draw' && prev.drawCount === 0) ? { ...base, phase: 'actions' as const } : base;
                  localStorage.setItem(LS_TURN, JSON.stringify(next)); return next;
                });
                setEventMode(null); setFlexibleAidSelected([]);
              },
              onFundCardDiscard: (cardId: string, _fundPlayer: string, _fundIdx: number) => {
                if (!setup) return;
                if (cardId === 'fund1') { setQuietNight(true); return; }
                if (cardId === 'fund5') { openForecast(); return; }
                if (cardId === 'fund7') {
                  if (turnState.phase === 'actions') {
                    setTurnState_(prev => { const next = { ...prev, actionsRemaining: prev.actionsRemaining + 2 }; localStorage.setItem(LS_TURN, JSON.stringify(next)); return next; });
                  } else if (turnState.phase === 'draw' && turnState.drawCount === 0) {
                    setTurnState_(prev => { const next = { ...prev, phase: 'actions' as const, actionsRemaining: prev.actionsRemaining + 2 }; localStorage.setItem(LS_TURN, JSON.stringify(next)); return next; });
                  } else {
                    setBonusActionsNextTurn(b => b + 2);
                  }
                  return;
                }
                if (cardId === 'fund2') { if (DISEASE_COLORS.reduce((s, col) => s + totalOfColor(cityInfection, col), 0) === 0) return; cubeSnapshotRef.current = cityInfection; setEventMode('remote-treatment'); setEventModeRemaining(2); }
                else if (cardId === 'fund3') { setEventMode('govt-grant'); setHighlightCities(CITIES.map(c => c.id)); }
                else if (cardId === 'fund4') { setEventMode('resilient-pop'); setShowDiscardPopup(true); }
                else if (cardId === 'fund6') { setEventMode('airlift'); }
                else if (cardId === 'fund8') { setEventMode('flexible-aid'); setFlexibleAidSelected([]); }
              },
            }, { player, idx: i, cityId, isFundingHand });
            return (
              <div key={`hand-${player}-${cityId}-${i}`}
                onPointerDown={onCardDown}
                onMouseEnter={e => { if (!handDrag) setHandHover({ player, idx: i, x: e.clientX, y: e.clientY }); }}
                onMouseLeave={() => setHandHover(null)}
                style={{
                  position: "absolute",
                  left: `${area.x}%`,
                  top: `${areaTop + i * stackOffset}%`,
                  width: `${area.w}%`,
                  transform: (isFundingHand && !handDrag && handHover?.player === player && handHover?.idx === i) ? "translateX(-50%) scale(1.4)" : "translateX(-50%)",
                  transformOrigin: (player === 'p2' || player === 'p4') ? "100% 50%" : "0% 50%",
                  transition: isFundingHand ? "transform 0.12s ease" : undefined,
                  zIndex: (handHover?.player === player && handHover?.idx === i) ? 410 : 15 + i,
                  cursor: "grab",
                  opacity: isDragging ? 0.25 : 1,
                  touchAction: "none", userSelect: "none",
                  outline: isSelected ? "3px solid #ffdd44" : "none",
                  borderRadius: isSelected ? 4 : 0,
                  boxShadow: isSelected ? "0 0 12px 3px #ffdd44aa" : "none",
                }}>
                {city
                  ? <PlayerCard city={city} width={pxW} />
                  : isFundingHand
                  ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden" }}><img src={FUND_IMGS[cityId]} draggable={false} style={{ width: "100%", height: "100%", objectFit: "fill", display: "block", pointerEvents: "none" }} /></div>
                  : <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden" }}><img src={epidemicCardSrc} alt="Epidemic" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block", pointerEvents: "none" }} /></div>
                }
              </div>
            );
          });
        })}

        {/* Player tokens — P1 pink, P2 blue */}
        {([
          { key: 'p1', token: tokenP1, setToken: setTokenP1, lsKey: LS_TOKEN_P1 },
          { key: 'p2', token: tokenP2, setToken: setTokenP2, lsKey: LS_TOKEN_P2 },
          { key: 'p3', token: tokenP3, setToken: setTokenP3, lsKey: LS_TOKEN_P3 },
          { key: 'p4', token: tokenP4, setToken: setTokenP4, lsKey: LS_TOKEN_P4 },
        ] as { key: string; token: CardState; setToken: (c: CardState) => void; lsKey: string }[])
        .filter(({ key }) => (activePlayers as readonly string[]).includes(key))
        .map(({ key, token: t, setToken, lsKey }) => {
          const color = playerColors[key];
          const save = (c: CardState) => { setToken(c); localStorage.setItem(lsKey, JSON.stringify(c)); };
          const aspectH = t.w * BOARD_RATIO * 1.5;
          const isCurrentPlayerToken = setup && key === currentPlayerKey && turnState.phase === "actions";
          const onDragDown = (e: React.PointerEvent<HTMLDivElement>) => {
            if (calibrating) return;
            if (setup && !isCurrentPlayerToken) {
            const isAirliftMode = eventMode === 'airlift';
            if (!isAirliftMode && (roleId !== 'dispatcher' || turnState.phase !== "actions")) return;
          }
            e.stopPropagation(); e.preventDefault();
            const el = e.currentTarget; el.setPointerCapture(e.pointerId);
            const r = boardRef.current!.getBoundingClientRect();
            const sx = e.clientX; const sy = e.clientY; const ox = t.x; const oy = t.y;
            const onMove = (ev: PointerEvent) => save({ ...t, x: ox + ((ev.clientX - sx) / r.width) * 100, y: oy + ((ev.clientY - sy) / r.height) * 100 });
            const onUp = (ev: PointerEvent) => {
              el.removeEventListener("pointermove", onMove as any); el.removeEventListener("pointerup", onUp);
              const moved = Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6;
              // Airlift: drag pawn to any city — works at any phase, any player's turn
              if (moved && eventMode === 'airlift') {
                const dropX = ox + ((ev.clientX - sx) / r.width) * 100;
                const dropY = oy + ((ev.clientY - sy) / r.height) * 100;
                const targetId = nearestCity(dropX, dropY);
                if (targetId) {
                  const pi = (['p1','p2','p3','p4'] as const).indexOf(key as 'p1'|'p2'|'p3'|'p4');
                  const nextCities = [...playerCities]; nextCities[pi] = targetId;
                  savePlayerCities(nextCities); snapPawnToCity(key, targetId);
                  setEventMode(null); setAirliftPawn(null); setHighlightCities([]);
                  if (pendingEventCard) resolveEventCard(pendingEventCard);
                } else { save({ ...t, x: ox, y: oy }); }
                return;
              }
              if (!setup || turnState.phase !== "actions") return;
              const pi = (['p1','p2','p3','p4'] as const).indexOf(key as 'p1'|'p2'|'p3'|'p4');
              if (!moved) {
                save({ ...t, x: ox, y: oy });
                return;
              }
              // Only current player can initiate a drag-move; Dispatcher can drag any pawn
              if (key !== currentPlayerKey && roleId !== 'dispatcher') { save({ ...t, x: ox, y: oy }); return; }
              const dropX = ox + ((ev.clientX - sx) / r.width) * 100;
              const dropY = oy + ((ev.clientY - sy) / r.height) * 100;
              const targetId = nearestCity(dropX, dropY);
              // Prefer logical city; fall back to nearest city to the token's visual position
              // so pawns placed manually (not via card action) still validate correctly.
              const movedPawnCityId = playerCities[pi] ?? nearestCity(ox, oy) ?? "atlanta";
              const movedPawnCity = CITIES.find(c2 => c2.id === movedPawnCityId);
              const isNeighbor = targetId && (movedPawnCity?.neighbors.includes(targetId) ?? false);
              // Dispatcher can also move any pawn to a city occupied by another active player
              const isDispatcherOccupied = roleId === 'dispatcher' && targetId &&
                (['p1','p2','p3','p4'] as const).some((pk, pidx) =>
                  pk !== key &&
                  (activePlayers as readonly string[]).includes(pk) &&
                  playerCities[pidx] === targetId
                );
              const isShuttle = targetId && targetId !== movedPawnCityId &&
                researchStations.has(movedPawnCityId) && researchStations.has(targetId);
              if (targetId && (isNeighbor || isDispatcherOccupied || isShuttle)) {
                const nextCities = [...playerCities]; nextCities[pi] = targetId;
                savePlayerCities(nextCities);
                snapPawnToCity(key, targetId);
                saveTurnState(consumeAction(turnState));
              } else {
                save({ ...t, x: ox, y: oy }); // snap back
              }
            };
            el.addEventListener("pointermove", onMove as any); el.addEventListener("pointerup", onUp);
          };
          const onResizeDown = calibrating ? (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation(); e.preventDefault();
            const el = e.currentTarget; el.setPointerCapture(e.pointerId);
            const r = boardRef.current!.getBoundingClientRect();
            const sx = e.clientX; const ow = t.w;
            const onMove = (ev: PointerEvent) => save({ ...t, w: Math.max(0.5, ow + ((ev.clientX - sx) / r.width) * 100) });
            const onUp = () => { el.removeEventListener("pointermove", onMove as any); el.removeEventListener("pointerup", onUp); };
            el.addEventListener("pointermove", onMove as any); el.addEventListener("pointerup", onUp);
          } : undefined;
          const isInteractivePawn = !setup || calibrating ||
            eventMode === 'airlift' ||   // airlift: tap any pawn at any phase
            (turnState.phase === "actions" && (
              key === currentPlayerKey ||
              roleId === 'dispatcher'
            ));
          return (
            <div key={key}
              style={{
                position: "absolute",
                left: `${t.x}%`, top: `${t.y}%`,
                width: `${t.w}%`, height: `${aspectH}%`,
                transform: "translate(-50%, -50%)",
                zIndex: isInteractivePawn ? 25 : 10,
                outline: calibrating ? "2px dashed #fff" : "none",
                boxSizing: "border-box",
                touchAction: "none", userSelect: "none",
                opacity: isInteractivePawn ? 1 : 0.35,
                pointerEvents: "none",
              }}>
              <svg viewBox="0 0 100 150" style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none", cursor: calibrating ? "default" : isInteractivePawn ? "grab" : "default" }}>
                <path d="M 36,50 C 18,68 10,105 12,132 Q 12,148 50,148 Q 88,148 88,132 C 90,105 82,68 64,50 Z" fill={color} stroke={color === "#f0f0f0" ? "#999" : "none"} strokeWidth={color === "#f0f0f0" ? 1.5 : 0} />
                <ellipse cx="50" cy="50" rx="15" ry="8" fill={color} />
                <circle cx="50" cy="28" r="24" fill={color} stroke={color === "#f0f0f0" ? "#999" : "none"} strokeWidth={color === "#f0f0f0" ? 1.5 : 0} />
                <circle cx="40" cy="20" r="7" fill="rgba(255,255,255,0.30)" />
                {/* Bottom-half drag handle only — top half is click-through */}
                {isInteractivePawn && (
                  <rect x="0" y="75" width="100" height="75" fill="transparent"
                    style={{ pointerEvents: "all", cursor: calibrating ? "default" : "grab" }}
                    onPointerDown={onDragDown as unknown as React.PointerEventHandler<SVGRectElement>} />
                )}
              </svg>
              {calibrating && (
                <div onPointerDown={onResizeDown}
                  style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, background: "#fff", cursor: "se-resize", pointerEvents: "auto" }} />
              )}
            </div>
          );
        })}

        {/* Hovered hand card — overlay above all */}
        {handHover && boardPxW > 0 && (() => {
          const area = handHover.player === 'p1' ? HAND_P1 : handHover.player === 'p2' ? HAND_P2 : handHover.player === 'p3' ? HAND_P3 : HAND_P4;
          const cards = (handCards as Record<string,string[]>)[handHover.player] ?? [];
          const cityId = cards[handHover.idx];
          const isFundH = FUND_IMGS[cityId] !== undefined;
          const city = (cityId === "epidemic" || isFundH) ? null : CITIES.find(c => c.id === cityId);
          if (!city && cityId !== "epidemic" && !isFundH) return null;
          const areaTop = area.y - area.h / 2;
          const stackOffset = handStackOffset(area, cards.length);
          const pxW = (area.w / 100) * boardPxW;
          return (
            <div style={{
              position: "absolute",
              left: `${area.x}%`,
              top: `${areaTop + handHover.idx * stackOffset}%`,
              width: `${area.w}%`,
              transform: "translateX(-50%)",
              zIndex: 400,
              pointerEvents: "none",
            }}>
              {city
                ? <PlayerCard city={city} width={pxW} />
                : isFundH
                ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden", position: "relative" }}><img src={FUND_IMGS[cityId]} draggable={false} style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block" }} /></div>
                : <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden" }}><img src={epidemicCardSrc} alt="Epidemic" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block" }} /></div>
              }
            </div>
          );
        })()}

        {/* Floating dragged hand card */}
        {handDrag && boardPxW > 0 && (() => {
          const area = handDrag.player === 'p1' ? HAND_P1 : handDrag.player === 'p2' ? HAND_P2 : handDrag.player === 'p3' ? HAND_P3 : HAND_P4;
          const cityId = ((handCards as Record<string,string[]>)[handDrag.player] ?? [])[handDrag.idx];
          const isFundDrag = FUND_IMGS[cityId] !== undefined;
          const city = (cityId === "epidemic" || isFundDrag) ? null : CITIES.find(c => c.id === cityId);
          if (!city && cityId !== "epidemic" && !isFundDrag) return null;
          const pxW = (area.w / 100) * boardPxW;
          return (
            <div style={{
              position: "absolute",
              left: `${handDrag.x}%`, top: `${handDrag.y}%`,
              width: `${area.w}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 500, pointerEvents: "none",
              filter: "drop-shadow(0 6px 20px #000e)",
            }}>
              {city
                ? <PlayerCard city={city} width={pxW} />
                : isFundDrag
                ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden", position: "relative" }}><img src={FUND_IMGS[cityId]} draggable={false} style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block" }} /></div>
                : <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden" }}><img src={epidemicCardSrc} alt="Epidemic" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block" }} /></div>
              }
            </div>
          );
        })()}

        {/* Character icons — small role thumbnail in each active player's hand area, hover shows full role card */}
        {(activePlayers as readonly string[]).map(pid => {
          const area = pid === 'p1' ? HAND_P1 : pid === 'p2' ? HAND_P2 : pid === 'p3' ? HAND_P3 : HAND_P4;
          const pidIndex = ['p1','p2','p3','p4'].indexOf(pid);
          const roleId = setup?.playerOrder[pidIndex]?.roleId ?? null;
          const roleSrc = roleId ? ROLE_IMGS[roleId] : null;
          if (!roleSrc) return null;
          const color = playerColors[pid];
          const isLeft = pid === 'p1' || pid === 'p3';
          // P1/P2 (top): icon floats above their hand area
          // P3/P4 (bottom): icon sits at the top of their hand area to avoid overlapping P1/P2 cards
          const iconY = (pid === 'p3' || pid === 'p4')
            ? area.y - area.h / 2 + 3
            : area.y - area.h / 2 - 10;
          return (
            <div
              key={`char-icon-${pid}`}
              style={{
                position: "absolute",
                left: `${area.x}%`,
                top: `${iconY}%`,
                transform: "translateX(-50%)",
                zIndex: 35,
                cursor: "default",
              }}
              onMouseEnter={() => setRoleHover(pid)}
              onMouseLeave={() => setRoleHover(null)}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                overflow: "hidden",
                border: `2.5px solid ${color}`,
                boxShadow: `0 0 14px ${color}88`,
              }}>
                <img
                  src={roleSrc}
                  draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block", pointerEvents: "none", userSelect: "none" }}
                />
              </div>
              {roleHover === pid && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  ...(isLeft ? { left: "calc(100% + 8px)" } : { right: "calc(100% + 8px)" }),
                  zIndex: 600,
                  pointerEvents: "none",
                }}>
                  <img
                    src={roleSrc}
                    draggable={false}
                    style={{ width: 280, height: "auto", borderRadius: 10, boxShadow: "0 8px 36px #000e", display: "block", userSelect: "none" }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* P3 / P4 hand card areas — empty for now; show calibrate outline when calibrating */}
        {boardPxW > 0 && (['p3', 'p4'] as const).filter(p => (activePlayers as readonly string[]).includes(p)).map(player => {
          const area = player === 'p3' ? HAND_P3 : HAND_P4;
          const cards = handCards[player as keyof typeof handCards] as string[] | undefined ?? [];
          if (!calibrating && cards.length === 0) return null;
          const areaTop = area.y - area.h / 2;
          return (
            <div key={`hand-area-${player}`}>
              {calibrating && (
                <div style={{
                  position: "absolute",
                  left: `${area.x}%`, top: `${areaTop}%`,
                  width: `${area.w}%`, height: `${area.h}%`,
                  transform: "translateX(-50%)",
                  zIndex: 6, border: "2px dashed #4af", boxSizing: "border-box",
                  display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 4,
                  pointerEvents: "none",
                }}>
                  <span style={{ color: "#4af", fontSize: 10, fontFamily: "monospace", userSelect: "none" }}>
                    {player === 'p3' ? 'Player 3' : 'Player 4'}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Chain outbreak city highlights — click to resolve */}
        {outbreakQueue.map(({ cityId, color }) => {
          const city = CITIES.find(c => c.id === cityId);
          if (!city) return null;
          const cubeColor = COLOR_TO_CUBE[color];
          return (
            <div
              key={`chain-${cityId}`}
              onClick={e => { e.stopPropagation(); handleChainClick(cityId, color); }}
              style={{
                position: "absolute",
                left: `${city.pos.x}%`,
                top: `${city.pos.y}%`,
                width: `${CUBE_W * 4}%`,
                aspectRatio: "1",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                border: `2.5px solid ${cubeColor}`,
                boxShadow: `0 0 12px 4px ${cubeColor}99, inset 0 0 8px ${cubeColor}44`,
                cursor: "pointer",
                zIndex: 80,
                animation: "chainPulse 0.9s ease-in-out infinite alternate",
              }}
            />
          );
        })}

        {MARKERS.map((m, i) => {
          const ci = CURE_INDICES.indexOf(i);
          const isCured = ci >= 0 && cured[ci];
          return (
            <BoardMarker
              key={m.key}
              src={m.src}
              alt={m.alt}
              aspectRatio={1}
              state={calibrating && !m.fixed ? states[i] : effectiveState(i)}
              calibrating={calibrating && !m.fixed}
              onChange={update(i)}
              tintColor={m.tintColor}
              cssFilter={m.cssFilter}
              eradicated={ci >= 0 ? eradicated[ci] : false}
              eradicatedColor={m.cssFilter?.includes("hue-rotate(58") ? "#666" : "white"}
              onActivate={isCured && !calibrating && !onChooseRoles && !setup ? () => {
                setEradicated(prev => {
                  const next = [...prev];
                  next[ci] = !next[ci];
                  return next;
                });
              } : undefined}
            />
          );
        })}

        {/* Block all board interaction when infection is complete and waiting to proceed */}
        {!setup && !!onInfectionDone && setupRemaining === 0 && (
          <div style={{ position: "absolute", inset: 0, zIndex: 900, cursor: "default" }} />
        )}
      </div>

      {/* City context menu */}
      {cityMenu && (() => {
        const city = CITIES.find(c => c.id === cityMenu.cityId);
        if (!city) return null;
        const level = panicLevels[cityMenu.cityId] ?? 0;
        const setLevel = (n: number) => {
          const clamped = Math.max(0, Math.min(5, n));
          const next = { ...panicLevels, [cityMenu.cityId]: clamped };
          setPanicLevels(next);
          localStorage.setItem(LS_PANIC_LEVELS, JSON.stringify(next));
        };
        const hasStation = researchStations.has(cityMenu.cityId);
        const canAdd = !hasStation && researchStations.size < 6;
        const menuStyle: React.CSSProperties = {
          background: "#111418", borderRadius: 5,
          boxShadow: "0 4px 20px #000c", minWidth: 110, overflow: "visible",
          fontFamily: "system-ui, sans-serif", fontSize: 12,
        };
        const itemStyle = (active: boolean): React.CSSProperties => ({
          padding: "7px 10px", color: active ? "#e8e8e8" : "#888",
          cursor: "default", display: "flex", justifyContent: "space-between",
          alignItems: "center", gap: 8, userSelect: "none",
          background: "transparent", borderRadius: 3,
          transition: "background 0.1s",
        });
        const subStyle: React.CSSProperties = {
          ...menuStyle,
          position: "absolute", left: "100%", top: 0, marginLeft: 4,
        };
        return (
          <ContextMenu x={cityMenu.x} y={cityMenu.y} minWidth={110}
            wrapStyle={{ overflow: "visible", padding: 3 }}
            onClose={() => { setCityMenu(null); setCityMenuHover(null); }}>

              {/* Building */}
              <div style={{ position: "relative" }}
                onMouseEnter={() => setCityMenuHoverDelayed("building")}
                onMouseLeave={() => setCityMenuHoverDelayed(null)}>
                <div style={{ ...itemStyle(true), background: cityMenuHover === "building" ? "#23282f" : "transparent" }}>
                  Building <span style={{ fontSize: 9, color: "#555" }}>▶</span>
                </div>
                {cityMenuHover === "building" && (
                  <div style={subStyle} onClick={e => e.stopPropagation()}
                    onMouseEnter={() => setCityMenuHoverDelayed("building")}
                    onMouseLeave={() => setCityMenuHoverDelayed(null)}>
                    <div style={{ padding: 3 }}>
                      <div
                        onClick={hasStation
                          ? () => { const n = new Set(researchStations); n.delete(cityMenu.cityId); setResearchStations(n); localStorage.setItem(LS_RESEARCH_STATIONS, JSON.stringify([...n])); setCityMenu(null); setCityMenuHover(null); }
                          : canAdd
                          ? () => { const n = new Set(researchStations); n.add(cityMenu.cityId); setResearchStations(n); localStorage.setItem(LS_RESEARCH_STATIONS, JSON.stringify([...n])); setCityMenu(null); setCityMenuHover(null); }
                          : undefined}
                        style={{ ...itemStyle(hasStation || canAdd), color: hasStation ? "#6ddc6d" : canAdd ? "#e8e8e8" : "#444", cursor: hasStation || canAdd ? "pointer" : "default" }}
                        onMouseEnter={e => { if (hasStation || canAdd) e.currentTarget.style.background = "#23282f"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                        Research Station {hasStation ? "✓" : ""}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Panic */}
              <div style={{ position: "relative" }}
                onMouseEnter={() => setCityMenuHoverDelayed("panic")}
                onMouseLeave={() => setCityMenuHoverDelayed(null)}>
                <div style={{ ...itemStyle(true), background: cityMenuHover === "panic" ? "#23282f" : "transparent" }}>
                  Panic <span style={{ fontSize: 9, color: "#555" }}>▶</span>
                </div>
                {cityMenuHover === "panic" && (
                  <div style={subStyle} onClick={e => e.stopPropagation()}
                    onMouseEnter={() => setCityMenuHoverDelayed("panic")}
                    onMouseLeave={() => setCityMenuHoverDelayed(null)}>
                    <div style={{ padding: 3 }}>
                      {[["−", level > 0, () => setLevel(level - 1)], ["+", level < 5, () => setLevel(level + 1)]].map(([label, enabled, action]) => (
                        <div key={label as string}
                          onClick={e => { e.stopPropagation(); if (enabled) (action as () => void)(); }}
                          style={{ padding: "7px 14px", color: enabled ? "#e8e8e8" : "#444", cursor: enabled ? "pointer" : "default", borderRadius: 3 }}
                          onMouseEnter={e => { if (enabled) e.currentTarget.style.background = "#23282f"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          {label as string}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

          </ContextMenu>
        );
      })()}

      {/* Objective card context menu */}
      {objMenu && (
        <ContextMenu variant="blue" x={objMenu.x} y={objMenu.y} minWidth={150} onClose={() => setObjMenu(null)}>
          <MenuItem variant="blue" onClick={() => {
            setObjectiveCompleted(prev => { const n = [...prev]; n[objMenu.idx] = !n[objMenu.idx]; return n; });
            setObjMenu(null);
          }}>
            {objectiveCompleted[objMenu.idx] ? "✓ Completed" : "Completed"}
          </MenuItem>
          <MenuItem variant="blue" color="#f66" onClick={() => {
            const idx = objMenu.idx;
            setObjectiveCompleted(prev => { const n = [...prev]; n.splice(idx, 1); return n; });
            setObjectiveCount(prev => prev - 1);
            setObjMenu(null);
          }}>
            Destroy
          </MenuItem>
        </ContextMenu>
      )}

      {/* Infection deck context menu */}
      {deckMenu && (
        <ContextMenu variant="blue" x={deckMenu.x} y={deckMenu.y} minWidth={140} onClose={() => setDeckMenu(null)}>
          {!setup && <MenuItem variant="blue" onClick={shuffleDeck}>Shuffle</MenuItem>}
          <MenuItem variant="blue" onClick={() => {
            if (infectDeck.length === 0) return;
            const bottom = infectDeck[0];
            setInfectDeck(infectDeck.slice(1));
            setInfectDiscard(prev => [...prev, bottom]);
            setDeckMenu(null);
            if (epidemicState?.phase === 'infect') epidemicInfect(bottom);
          }}>
            Draw Bottom
          </MenuItem>
        </ContextMenu>
      )}

      {/* Forecast popup */}
      {forecastCards && boardPxW > 0 && (
        <ForecastPopup
          cards={forecastCards}
          onReorder={(from, to) => setForecastCards(prev => {
            if (!prev) return prev;
            const next = [...prev];
            [next[from], next[to]] = [next[to], next[from]];
            return next;
          })}
          onConfirm={confirmForecast}
          onCancel={() => setForecastCards(null)}
        />
      )}



      {/* Infection discard context menu */}
      {discardMenu && (
        <ContextMenu variant="blue" x={discardMenu.x} y={discardMenu.y} minWidth={140} onClose={() => setDiscardMenu(null)}>
          <MenuItem variant="blue" onClick={shuffleDiscardOntoDeck}>Shuffle</MenuItem>
        </ContextMenu>
      )}

      {/* Infection discard popup */}
      {showPlayerDiscardPopup && (
        <div
          onClick={() => setShowPlayerDiscardPopup(false)}
          style={{
            position: "fixed", inset: 0, background: "#000a",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0c1335", border: "2px solid #334",
              borderRadius: 10, padding: 20, maxWidth: "90vw", maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div style={{ color: "#aac", fontSize: 13, marginBottom: 12, fontFamily: "monospace" }}>
              Player Discard — {playerDiscard.length} card{playerDiscard.length !== 1 ? "s" : ""}
              <button onClick={() => setShowPlayerDiscardPopup(false)}
                style={{ float: "right", background: "none", border: "1px solid #556", color: "#aac", cursor: "pointer", borderRadius: 4, padding: "2px 8px" }}>
                ✕
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[...playerDiscard].reverse().map((cityId, i) => {
                const isFundPopup = FUND_IMGS[cityId] !== undefined;
                const city = (cityId === "epidemic" || isFundPopup) ? null : CITIES.find(c => c.id === cityId);
                if (!city && cityId !== "epidemic" && !isFundPopup) return null;
                return (
                  <div key={`pdpopup-${i}`}
                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setDiscardCardMenu({ cityId, x: e.clientX, y: e.clientY }); }}
                    style={{ cursor: "context-menu" }}>
                    {city
                      ? <PlayerCard city={city} width={110} />
                      : isFundPopup
                      ? <div style={{ width: 110, aspectRatio: "2.5/3.5", overflow: "hidden", position: "relative" }}><img src={FUND_IMGS[cityId]} draggable={false} style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block" }} /></div>
                      : <div style={{ width: 110, aspectRatio: "2.5/3.5", overflow: "hidden" }}><img src={epidemicCardSrc} alt="Epidemic" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block" }} /></div>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Player deck right-click menu */}
      {playerDeckMenu && (
        <ContextMenu x={playerDeckMenu.x} y={playerDeckMenu.y} minWidth={120}
          wrapStyle={{ padding: 3 }} onClose={() => setPlayerDeckMenu(null)}>
          {!setup && <MenuItem radius={3} onClick={() => {
            const allCards = [...handCards.p1, ...handCards.p2, ...playerDiscard];
            const cityCards = allCards.filter(id => id !== "epidemic");
            const epidemicCards = allCards.filter(id => id === "epidemic").length;
            setPlayerDeck(prev => [...cityCards, ...prev]);
            setEpidemicCount(c => c + epidemicCards);
            setPlayerFlipped(prev => { const n = new Set(prev); n.delete("epidemic"); return n; });
            setPlayerFlipped(new Set());
            saveHandCards({ ...handCards, p1: [], p2: [], p3: [], p4: [] });
            setPlayerDiscard([]);
            setPlayerDeckMenu(null);
          }}>
            Recall
          </MenuItem>}
          {!setup && <MenuItem radius={3} onClick={() => {
            setIsShufflingPlayer(true);
            setTimeout(() => setIsShufflingPlayer(false), 900);
            setPlayerDeck(prev => shuffleEpidemicsIntoDeck(prev, epidemicCount));
            setEpidemicCount(0);
            setPlayerFlipped(new Set());
            setPlayerDeckMenu(null);
          }}>
            Shuffle
          </MenuItem>}
        </ContextMenu>
      )}

      {/* Player discard card context menu — send to hand */}
      {discardCardMenu && (
        <ContextMenu x={discardCardMenu.x} y={discardCardMenu.y} minWidth={110}
          overlayZIndex={1100} onClose={() => setDiscardCardMenu(null)}>
          {discardCardMenu.cityId === "epidemic"
            ? (
              <MenuItem onClick={() => {
                setPlayerDiscard(prev => prev.filter(id => id !== "epidemic"));
                setEpidemicCount(c => c + 1);
                setPlayerFlipped(prev => { const n = new Set(prev); n.delete("epidemic"); return n; });
                setDiscardCardMenu(null);
              }}>
                Return to deck
              </MenuItem>
            )
            : (['p1', 'p2'] as const).map(player => (
              <MenuItem key={player} onClick={() => {
                const cityId = discardCardMenu.cityId;
                setPlayerDiscard(prev => prev.filter(id => id !== cityId));
                saveHandCards({ ...handCards, [player]: [...handCards[player], cityId] });
                setDiscardCardMenu(null);
              }}>
                {player === 'p1' ? 'Player 1' : 'Player 2'}
              </MenuItem>
            ))}
        </ContextMenu>
      )}

      {/* Charter Flight / Build Research Station popup */}
      {pendingDiscardMenu && (
        <ContextMenu x={pendingDiscardMenu.x} y={pendingDiscardMenu.y} minWidth={160}
          overlayZIndex={1100} onClose={() => setPendingDiscardMenu(null)}>
          <MenuItem padding="9px 14px" onClick={() => {
            // Discard card, set pendingCharter, highlight all cities
            const { player, idx, cityId } = pendingDiscardMenu;
            const current = (handCards as Record<string,string[]>)[player] ?? [];
            saveHandCards({ ...handCards, [player]: current.filter((_, j) => j !== idx) });
            setPlayerDiscard(prev => [...prev, cityId]);
            setHighlightCities(CITIES.map(c => c.id));
            saveTurnState({ ...turnState, pendingCharter: true });
            setPendingDiscardMenu(null);
          }}>
            Charter Flight
          </MenuItem>
          <MenuItem padding="9px 14px"
            disabled={researchStations.has(pendingDiscardMenu.cityId) || researchStations.size >= 6}
            onClick={() => {
              const { player, idx, cityId } = pendingDiscardMenu;
              const current = (handCards as Record<string,string[]>)[player] ?? [];
              saveHandCards({ ...handCards, [player]: current.filter((_, j) => j !== idx) });
              setPlayerDiscard(prev => [...prev, cityId]);
              const next = new Set(researchStations); next.add(cityId);
              setResearchStations(next);
              localStorage.setItem(LS_RESEARCH_STATIONS, JSON.stringify([...next]));
              saveTurnState(consumeAction(turnState));
              setPendingDiscardMenu(null);
            }}>
            {`Build Research Station${researchStations.has(pendingDiscardMenu.cityId) ? " (already here)" : researchStations.size >= 6 ? " (pool empty)" : ""}`}
          </MenuItem>
        </ContextMenu>
      )}

      {/* RS Action menu — Shuttle Flight / Discover Cure */}
      {rsActionMenu && (
        <ContextMenu x={rsActionMenu.x} y={rsActionMenu.y} minWidth={150}
          overlayZIndex={1100} onClose={() => setRsActionMenu(null)}>
          {(() => {
            const hand = currentPlayerHand;
            const cureColor = DISEASE_COLORS.find(col => {
              const ci = COLOR_TO_CURE_IDX[col]; if (ci === undefined || cured[ci]) return false;
              return hand.filter(id => CITIES.find(c => c.id === id)?.color === col).length >= cureThreshold;
            });
            if (!cureColor) return null;
            return (
              <MenuItem padding="9px 14px" onClick={() => {
                setCureSelecting(true); setSelectedHandCards([]);
                setRsActionMenu(null);
              }}>
                Discover Cure
              </MenuItem>
            );
          })()}
        </ContextMenu>
      )}

      {/* January: COdA naming popup */}
      {isJan && codaPopupOpen && (
        <CodaPopup
          codaColor={codaColor}
          candidates={codaCandidates}
          onChoose={(color) => {
            setCodaColor(color as DiseaseColor);
            localStorage.setItem(LS_CODA_COLOR, color);
            setCodaCandidates([]);
            setCodaPopupOpen(false);
          }}
          onClickOverlay={() => { if (codaColor !== null) setCodaPopupOpen(false); }}
        />
      )}

      {/* January: disease naming on eradication */}
      {isJan && namePopupColor && (
        <DiseaseNamePopup
          color={namePopupColor}
          currentName={diseaseNames[namePopupColor] ?? ''}
          onConfirm={(name) => {
            const next = { ...diseaseNames, [namePopupColor]: name };
            setDiseaseNames(next);
            localStorage.setItem(LS_DISEASE_NAMES, JSON.stringify(next));
            setNamePopupColor(null);
          }}
        />
      )}

      {/* Win / Lose overlay */}
      {gameResult !== null && gameResult !== dismissedResult && (
        <GameOverOverlay
          result={gameResult}
          loseReason={loseReason}
          onContinue={() => setDismissedResult(gameResult)}
          onRestart={onRestart}
          onMainMenu={onMainMenu}
          janWinBonusSrc={isJan ? janWinBonusSrc : undefined}
          janEndgameSrc={isJan ? janEndgameSrc : undefined}
        />
      )}

      {showDiscardPopup && (
        <InfectionDiscardPopup
          discard={infectDiscard}
          picking={eventMode === 'resilient-pop'}
          onClose={() => setShowDiscardPopup(false)}
          onPick={(realIdx) => {
            setInfectDiscard(prev => prev.filter((_, j) => j !== realIdx));
            setShowDiscardPopup(false);
            setEventMode(null);
            if (pendingEventCard) resolveEventCard(pendingEventCard);
          }}
        />
      )}
      {/* Action log */}
      {actionLog.length > 0 && (
        <div style={{
          marginTop: 8, padding: "6px 12px",
          background: "#060c12", border: "1px solid #1a2a3a",
          borderRadius: 6, fontFamily: "system-ui, sans-serif", fontSize: 11,
          color: "#889", maxHeight: 120, overflowY: "auto",
          display: "flex", flexDirection: "column-reverse",
        }}>
          {[...actionLog].reverse().map((entry, i) => (
            <div key={i} style={{ lineHeight: 1.8, color: i === 0 ? "#aac" : "#667" }}>{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}
