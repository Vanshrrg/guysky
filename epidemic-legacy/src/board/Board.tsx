import { useRef, useState, useEffect } from "react";
import boardArt from "../../object/newboard2.png";
import infectionCardBackSrc from "../../object/infectioncardback.png";
import playerCardBackSrc from "../../object/playercard back.png";
import epidemicCardSrc from "../../object/epidemic.png";
import objectiveSrc from "../../object/objective1.png";
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
import medicSrc from "../../object/medic.png";
import scientistSrc from "../../object/scientist.png";
import researcherSrc from "../../object/researcher.png";
import generalistSrc from "../../object/generalist.png";
import dispatcherSrc from "../../object/dispatcher.png";
import fund1Src from "../../object/fund1.png";
import fund2Src from "../../object/fund2.png";
import fund3Src from "../../object/fund3.png";
import fund4Src from "../../object/fund4.png";
import fund5Src from "../../object/fund5.png";
import fund6Src from "../../object/fund6.png";
import fund7Src from "../../object/fund7.png";
import fund8Src from "../../object/fund8.png";
import type { PreGameSetup } from "./PreGamePhase";
import { BOARD_RATIO, CUBE_W, shuffle, defaultCubes, inBox } from "./boardGeometry";
import { PANIC_TRAY_POS, OBJECTIVE_SLOTS, OUTBREAK_TRACK, INFECTION_TRACK } from "./boardLayout";
import {
  type CardState, type HandCards, type TurnPhase, type TurnStateData,
  LS_CURED, LS_CITY_INFECTION, LS_ERADICATED, LS_OUTBREAK_POS, LS_INFECTION_POS,
  LS_HAND_CARDS, LS_CARD_INFECTION, LS_CARD_PLAYER, LS_CARD_INFECTION_DISCARD,
  LS_CARD_PLAYER_DISCARD, LS_TOKEN_P1, LS_TOKEN_P2, LS_TOKEN_P3, LS_TOKEN_P4,
  LS_RESEARCH_STATIONS, LS_RESEARCH_POS, LS_PANIC_LEVELS, LS_HCMC_TRAY,
  LS_TURN, LS_PLAYER_CITIES,
  DEF_CARD_INFECTION, DEF_CARD_PLAYER, DEF_CARD_INFECTION_DISCARD, DEF_CARD_PLAYER_DISCARD,
  DEF_TOKEN_P1, DEF_TOKEN_P2, DEF_TOKEN_P3, DEF_TOKEN_P4,
  loadCard, loadTrackPos, loadHandCards, loadResearchStations, loadResearchPos,
  loadPanicLevels, loadHcmc, loadTurnState, loadPlayerCities,
} from "./boardStorage";
import { MARKERS, CURE_INDICES, COLOR_TO_CURE_IDX, loadMarker, loadCured, loadEradicated } from "./boardMarkers";
import { GameOverOverlay } from "./GameOverOverlay";
import { InfectionDiscardPopup } from "./InfectionDiscardPopup";
import { ForecastPopup } from "./ForecastPopup";

const COLOR_TO_CUBE: Record<string, string> = {
  blue: "#0A00A1", yellow: "#FFFA73", black: "#1a1a1a", red: "#cc1111",
};
const DISEASE_COLORS = ["black", "yellow", "red", "blue"] as const;
type DiseaseColor = typeof DISEASE_COLORS[number];
type CityColorCounts = Partial<Record<DiseaseColor, number>>;
type CityInfectionMap = Record<string, CityColorCounts>;
const CUBE_COLORS = ["#1a1a1a", "#FFFA73", "#cc1111", "#0A00A1"] as const;

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
  const persistGame = scenario !== "month0";
  const [cured, setCured] = useState<boolean[]>(() => persistGame ? loadCured() : CURE_INDICES.map(() => false));
  const [eradicated, setEradicated] = useState<boolean[]>(() => persistGame ? loadEradicated() : CURE_INDICES.map(() => false));
  const [outbreakPos, setOutbreakPos] = useState(() => persistGame ? loadTrackPos(LS_OUTBREAK_POS, OUTBREAK_TRACK.length - 1) : 0);
  const [infectionPos, setInfectionPos] = useState(() => persistGame ? loadTrackPos(LS_INFECTION_POS, INFECTION_TRACK.length - 1) : 0);
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
  const [cubes, setCubes] = useState<{ x: number; y: number }[]>(defaultCubes);
  const [cubeZ, setCubeZ] = useState<number[]>(() => Array(96).fill(0));
  const zCounter = useRef(0);
  // Card pile positions persist (calibration data)
  const [cardInfection, setCardInfection] = useState<CardState>(() => loadCard(LS_CARD_INFECTION, DEF_CARD_INFECTION));
  const [cardPlayer, setCardPlayer] = useState<CardState>(() => loadCard(LS_CARD_PLAYER, DEF_CARD_PLAYER));
  const [cardInfectionDiscard, setCardInfectionDiscard] = useState<CardState>(() => loadCard(LS_CARD_INFECTION_DISCARD, DEF_CARD_INFECTION_DISCARD));
  const [cardPlayerDiscard] = useState<CardState>(() => loadCard(LS_CARD_PLAYER_DISCARD, DEF_CARD_PLAYER_DISCARD));
  const [hcmcTray, setHcmcTray] = useState<{ x: number; y: number }>(() => loadHcmc());
  // 0 when epidemics are embedded in the deck (deal/game phases); 5 for raw board view
  const [epidemicCount, setEpidemicCount] = useState(5); // standalone pile, rendered below player deck
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
  const [infectDeck, setInfectDeck] = useState<string[]>(() => shuffle(CITIES.map(c => c.id)));
  const [infectDiscard, setInfectDiscard] = useState<string[]>([]);
  const [playerDeck, setPlayerDeck] = useState<string[]>(() => {
    // City (+ event) cards only — no embedded epidemics.
    // Epidemic standalone pile (epidemicCount=5) sits below visually.
    const fc = setup?.fundingCards ?? [];
    return shuffle([...CITIES.map(c => c.id), ...fc]);
  });
  const [playerFlipped, setPlayerFlipped] = useState<Set<string>>(() => new Set());
  const [playerDiscard, setPlayerDiscard] = useState<string[]>([]);
  const [playerDrag, setPlayerDrag] = useState<{ cityId: string; x: number; y: number } | null>(null);
  const [boardPxW, setBoardPxW] = useState(0);
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showPlayerDiscardPopup, setShowPlayerDiscardPopup] = useState(false);
  const [discardCardMenu, setDiscardCardMenu] = useState<{ cityId: string; x: number; y: number } | null>(null);
  const [playerDeckMenu, setPlayerDeckMenu] = useState<{ x: number; y: number } | null>(null);
  const [discardMenu, setDiscardMenu] = useState<{ x: number; y: number } | null>(null);
  const [deckMenu, setDeckMenu] = useState<{ x: number; y: number } | null>(null);
  const [forecastCards, setForecastCards] = useState<string[] | null>(null);
  const [dismissedResult, setDismissedResult] = useState<string | null>(null);
  // Turn system — only active during game phase (setup present)
  const [turnState, setTurnState_] = useState<TurnStateData>(() => loadTurnState());
  const saveTurnState = (next: TurnStateData) => { setTurnState_(next); localStorage.setItem(LS_TURN, JSON.stringify(next)); };
  const [playerCities, setPlayerCities_] = useState<string[]>(() => setup ? loadPlayerCities(setup.playerOrder.length) : []);
  const savePlayerCities = (next: string[]) => { setPlayerCities_(next); localStorage.setItem(LS_PLAYER_CITIES, JSON.stringify(next)); };
  const [highlightCities, setHighlightCities] = useState<string[]>([]);
  const [selectedHandCards, setSelectedHandCards] = useState<string[]>([]);
  const [cureSelecting, setCureSelecting] = useState(false);
  const [dispatcherTarget, setDispatcherTarget] = useState<string | null>(null);
  const [quietNight, setQuietNight] = useState(false);
  const [eventMode, setEventMode] = useState<null | 'remote-treatment' | 'govt-grant' | 'resilient-pop' | 'airlift' | 'flexible-aid'>(null);
  const [eventModeRemaining, setEventModeRemaining] = useState(0);
  // Snapshot of cube state when Remote Treatment starts, so cancelling part-way
  // through restores any cubes already removed.
  const cubeSnapshotRef = useRef<CityInfectionMap | null>(null);
  const [airliftPawn, setAirliftPawn] = useState<string | null>(null);
  const [flexibleAidSelected, setFlexibleAidSelected] = useState<string[]>([]);
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
    saveTurnState({ currentPlayerIndex: nextIdx, actionsRemaining: nextRoleId === 'generalist' ? 5 : 4, phase: "actions", pendingCharter: false, pendingShuttle: false, drawCount: 0, infectCount: 0 });
    setHighlightCities([]); setSelectedHandCards([]); setCureSelecting(false); setDispatcherTarget(null);
    setEventMode(null); setAirliftPawn(null); setFlexibleAidSelected([]); setEventModeRemaining(0); setPendingEventCard(null);
  };
  const currentPlayerHand = (): string[] => (handCards as Record<string, string[]>)[currentPlayerKey] ?? [];

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

  const playFundCard = (playerKey: string, cardIdx: number, cardId: string) => {
    if (!setup) return;
    if (cardId === 'fund2' && DISEASE_COLORS.reduce((s, col) => s + totalOfColor(cityInfection, col), 0) === 0) return;
    if (cardId === 'fund4' && infectDiscard.length === 0) return;
    if (cardId === 'fund5' && infectDeck.length === 0) return;
    if ((cardId === 'fund7' || cardId === 'fund8') && turnState.phase !== 'actions') return;
    const pending = { player: playerKey, idx: cardIdx, cardId };
    const discardNow = () => resolveEventCard(pending);
    if (cardId === 'fund1') { setQuietNight(true); discardNow(); return; }
    if (cardId === 'fund5') { openForecast(); discardNow(); return; }
    if (cardId === 'fund7') { saveTurnState({ ...turnState, actionsRemaining: turnState.actionsRemaining + 2 }); discardNow(); return; }
    setPendingEventCard(pending);
    if (cardId === 'fund2') { cubeSnapshotRef.current = cityInfection; setEventMode('remote-treatment'); setEventModeRemaining(2); }
    else if (cardId === 'fund3') { setEventMode('govt-grant'); setHighlightCities(CITIES.map(c => c.id)); }
    else if (cardId === 'fund4') { setEventMode('resilient-pop'); setShowDiscardPopup(true); }
    else if (cardId === 'fund6') { setEventMode('airlift'); }
    else if (cardId === 'fund8') { setEventMode('flexible-aid'); setFlexibleAidSelected([]); }
  };

  // Month 0 setup: place research station + all player tokens at Atlanta
  useEffect(() => {
    if (!setup || scenario !== "month0") return;
    const atlanta = CITIES.find(c => c.id === "atlanta");
    if (!atlanta) return;
    const { x, y } = atlanta.pos;

    // Research station at Atlanta
    setResearchStations(prev => {
      if (prev.has("atlanta")) return prev;
      const next = new Set(prev); next.add("atlanta");
      localStorage.setItem(LS_RESEARCH_STATIONS, JSON.stringify([...next]));
      return next;
    });

    // All active player tokens at Atlanta (slight offset so they don't stack perfectly)
    const offsets = [[-1, 0], [1, 0], [-1, 1.5], [1, 1.5]];
    const tokenSetters = [
      { set: setTokenP1, lsKey: LS_TOKEN_P1 },
      { set: setTokenP2, lsKey: LS_TOKEN_P2 },
      { set: setTokenP3, lsKey: LS_TOKEN_P3 },
      { set: setTokenP4, lsKey: LS_TOKEN_P4 },
    ];
    setup.playerOrder.forEach((_, pi) => {
      const [dx, dy] = offsets[pi] ?? [0, 0];
      const pos = { x: x + dx, y: y + dy, w: 2.42 };
      tokenSetters[pi].set(pos);
      localStorage.setItem(tokenSetters[pi].lsKey, JSON.stringify(pos));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);

  // Panic levels are permanent legacy state — save whenever they change
  useEffect(() => {
    localStorage.setItem(LS_PANIC_LEVELS, JSON.stringify(panicLevels));
  }, [panicLevels]);

  // Persist cure / eradication / outbreak-rate / infection-rate progress so a
  // reload restores the game. Skipped in Month 0 (always a fresh setup).
  useEffect(() => { if (persistGame) localStorage.setItem(LS_CURED, JSON.stringify(cured)); }, [cured, persistGame]);
  useEffect(() => { if (persistGame) localStorage.setItem(LS_ERADICATED, JSON.stringify(eradicated)); }, [eradicated, persistGame]);
  useEffect(() => { if (persistGame) localStorage.setItem(LS_OUTBREAK_POS, String(outbreakPos)); }, [outbreakPos, persistGame]);
  useEffect(() => { if (persistGame) localStorage.setItem(LS_INFECTION_POS, String(infectionPos)); }, [infectionPos, persistGame]);

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
    // Deck = shuffled city + event cards only; standalone epidemic pile (count=5) stays below
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
    setInfectDeck(prev => [...prev, ...shuffle(infectDiscard)]);
    setInfectDiscard([]);
    setDiscardMenu(null);
    if (epidemicState) {
      // Step 3 complete — auto-discard epidemic card and clear state
      setEpidemicState(null);
      setEpidemicCount(c => c - 1);
      setPlayerFlipped(prev => { const n = new Set(prev); n.delete("epidemic"); return n; });
      setPlayerDiscard(prev => [...prev, "epidemic"]);
    }
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
    setInfectDeck(newDeck);
    setInfectDiscard(prev => [...prev, drawn]);

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

    // Outbreak track: click any of the 9 positions
    const obW = states[0].w; // use outbreak marker's size
    for (let i = 0; i < OUTBREAK_TRACK.length; i++) {
      const p = OUTBREAK_TRACK[i];
      if (p.x === 0 && p.y === 0) continue; // not calibrated yet
      if (inBox(px, py, p.x, p.y, obW)) {
        setOutbreakPos(i);
        return;
      }
    }

    // Infection rate track: click any of the 7 positions
    const irW = states[2].w;
    for (let i = 0; i < INFECTION_TRACK.length; i++) {
      const p = INFECTION_TRACK[i];
      if (p.x === 0 && p.y === 0) continue;
      if (inBox(px, py, p.x, p.y, irW)) {
        setInfectionPos(i);
        return;
      }
    }

    for (let ci = 0; ci < CURE_INDICES.length; ci++) {
      const mi = CURE_INDICES[ci];
      const m = MARKERS[mi];
      if (!m.curePos) continue;
      const startPos = states[mi];

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
    if (eventMode === 'remote-treatment') {
      const city = CITIES.find(c => c.id === cityId);
      if (!city) return;
      const counts = cityInfection[cityId] ?? {};
      // Remove a cube of any color present — prefer the native color, else the
      // first foreign color with cubes (e.g. placed by a neighbor's outbreak).
      const native = city.color as DiseaseColor;
      const color: DiseaseColor | undefined = (counts[native] ?? 0) > 0
        ? native
        : DISEASE_COLORS.find(c => (counts[c] ?? 0) > 0);
      if (!color) return;
      const cur = counts[color] ?? 0;
      const next = { ...cityInfection, [cityId]: { ...cityInfection[cityId], [color]: cur - 1 } };
      saveCityInfection(next);
      const ci = COLOR_TO_CURE_IDX[color];
      if (ci !== undefined && cured[ci] && !eradicated[ci] && totalOfColor(next, color) === 0)
        setEradicated(prev => { const n = [...prev]; n[ci] = true; return n; });
      const left = eventModeRemaining - 1;
      if (left <= 0) { cubeSnapshotRef.current = null; setEventMode(null); setEventModeRemaining(0); if (pendingEventCard) resolveEventCard(pendingEventCard); }
      else setEventModeRemaining(left);
      return;
    }
    if (eventMode === 'airlift' && airliftPawn) {
      const pi = (['p1','p2','p3','p4'] as const).indexOf(airliftPawn as 'p1'|'p2'|'p3'|'p4');
      const nextCities = [...playerCities]; nextCities[pi] = cityId;
      savePlayerCities(nextCities); snapPawnToCity(airliftPawn, cityId);
      setEventMode(null); setAirliftPawn(null); setHighlightCities([]);
      if (pendingEventCard) resolveEventCard(pendingEventCard);
      return;
    }

    if (setup && turnState.phase === "actions") {
      if (dispatcherTarget && highlightCities.includes(cityId)) {
        // Dispatcher transport: move selected pawn to this teammate city
        const pi = (['p1','p2','p3','p4'] as const).indexOf(dispatcherTarget as 'p1'|'p2'|'p3'|'p4');
        const nextCities = [...playerCities]; nextCities[pi] = cityId;
        savePlayerCities(nextCities); snapPawnToCity(dispatcherTarget, cityId);
        setDispatcherTarget(null); setHighlightCities([]);
        saveTurnState(consumeAction(turnState));
        return;
      }
      if (turnState.pendingCharter) {
        // Charter flight: fly to any city
        const nextCities = [...playerCities]; nextCities[turnState.currentPlayerIndex] = cityId;
        savePlayerCities(nextCities); snapPawnToCity(currentPlayerKey, cityId);
        setHighlightCities([]);
        saveTurnState(consumeAction({ ...turnState, pendingCharter: false }));
        return;
      }
      if (turnState.pendingShuttle) {
        // Shuttle flight: only valid if target has a research station
        if (!researchStations.has(cityId) || cityId === currentPlayerCityId) return;
        const nextCities = [...playerCities]; nextCities[turnState.currentPlayerIndex] = cityId;
        savePlayerCities(nextCities); snapPawnToCity(currentPlayerKey, cityId);
        setHighlightCities([]);
        saveTurnState(consumeAction({ ...turnState, pendingShuttle: false }));
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

    if (setup) {
      // In game phase: cube removal only via Treat Disease action
      if (turnState.phase !== "actions") return;
      if (cityId !== currentPlayerCityId) return; // must be in same city
      const ci = COLOR_TO_CURE_IDX[color];
      const isDiseaseCured = ci !== undefined && cured[ci];
      if (isDiseaseCured) {
        // Remove all cubes of this color
        const next = { ...cityInfection, [cityId]: { ...cityInfection[cityId], [color]: 0 } };
        saveCityInfection(next);
        if (ci !== undefined && !eradicated[ci] && totalOfColor(next, color) === 0) {
          setEradicated(prev => { const n = [...prev]; n[ci] = true; return n; });
        }
      } else {
        // Medic removes ALL cubes of a color in one Treat action, even uncured
        const newCount = roleId === 'medic' ? 0 : cur - 1;
        const next = { ...cityInfection, [cityId]: { ...cityInfection[cityId], [color]: newCount } };
        saveCityInfection(next);
        if (ci !== undefined && cured[ci] && !eradicated[ci] && totalOfColor(next, color) === 0) {
          setEradicated(prev => { const n = [...prev]; n[ci] = true; return n; });
        }
      }
      saveTurnState(consumeAction(turnState));
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
  const placedPerColor = DISEASE_COLORS.map(color => totalOfColor(cityInfection, color));

  const allObjectivesDone = objectiveCount > 0 && objectiveCompleted.slice(0, objectiveCount).every(Boolean);
  const cubesExhausted = placedPerColor.some(count => count >= 24);
  const playerDeckEmpty = playerDeck.length === 0 && epidemicCount === 0;
  const outbreakMaxed = outbreakPos >= OUTBREAK_TRACK.length - 1;
  const gameResult: 'win' | 'lose' | null = allObjectivesDone ? 'win'
    : (outbreakMaxed || playerDeckEmpty || cubesExhausted) ? 'lose'
    : null;
  const loseReason = outbreakMaxed ? "Too many outbreaks!"
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
          {dealComplete && (
            <span style={{ color: "#ffcc44", fontWeight: 700, marginLeft: 4 }}>
              ⚠ Shuffle 5 epidemic cards into the player deck now!
            </span>
          )}
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
              Step 2 — Right-click the <strong>infection deck</strong> → <strong>Draw Bottom</strong>
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
              <button
                onClick={() => {
                  setEpidemicState(null);
                  setEpidemicCount(c => c - 1);
                  setPlayerFlipped(prev => { const n = new Set(prev); n.delete("epidemic"); return n; });
                  setPlayerDiscard(prev => [...prev, "epidemic"]);
                }}
                style={{
                  marginLeft: "auto", padding: "4px 14px", fontSize: 11,
                  background: "#0a1a2a", border: "1px solid #336699", color: "#88bbdd",
                  borderRadius: 5, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                One Quiet Night — Skip
              </button>
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
      {setup && (() => {
        const player = setup.playerOrder[turnState.currentPlayerIndex];
        const ROLE_NAMES: Record<string, string> = { medic: "Medic", scientist: "Scientist", researcher: "Researcher", generalist: "Generalist", dispatcher: "Dispatcher" };
        const playerName = (player?.roleId ? ROLE_NAMES[player.roleId] : null) ?? `Player ${turnState.currentPlayerIndex + 1}`;
        const pColor = playerColors[currentPlayerKey] ?? "#fff";
        const infectTarget = INFECTION_RATE_VALUES[infectionPos] ?? 2;
        const infectionDone = turnState.infectCount >= infectTarget;

        let instruction = "";
        if (turnState.phase === "actions") {
          if (turnState.pendingCharter) instruction = "Charter Flight — click any city";
          else if (turnState.pendingShuttle) instruction = "Shuttle Flight — click a highlighted station";
          else if (cureSelecting) {
            const canConfirm = (() => {
              for (const col of DISEASE_COLORS) {
                const ci = COLOR_TO_CURE_IDX[col];
                if (ci === undefined || cured[ci]) continue;
                const sel = selectedHandCards.filter(id => CITIES.find(c => c.id === id)?.color === col);
                if (sel.length >= cureThreshold) return col;
              }
              return null;
            })();
            instruction = canConfirm
              ? `Select ${cureThreshold} ${canConfirm} cards then confirm (${selectedHandCards.length} selected)`
              : `Select ${cureThreshold} cards of the same color (${selectedHandCards.length} selected)`;
          }
          else if (roleId === 'dispatcher' && dispatcherTarget) instruction = "Click a highlighted city to move the selected pawn there";
          else if (roleId === 'dispatcher') instruction = "Drag any pawn to a neighbor, or tap a pawn to transport to a teammate";
          else instruction = "Drag your pawn or use a card action";
        } else if (turnState.phase === "draw") {
          instruction = `Draw 2 player cards (${turnState.drawCount}/2) — flip then drag to hand`;
        } else if (turnState.phase === "discard") {
          instruction = "Hand limit — drag excess cards to discard (keep 7)";
        } else if (turnState.phase === "infect") {
          instruction = infectionDone ? "All infection cards drawn" : `Draw ${infectTarget} infection cards (${turnState.infectCount}/${infectTarget})`;
        }
        const canConfirmCure = (() => {
          if (!cureSelecting) return null;
          for (const col of DISEASE_COLORS) {
            const ci = COLOR_TO_CURE_IDX[col];
            if (ci === undefined || cured[ci]) continue;
            const sel = selectedHandCards.filter(id => CITIES.find(c => c.id === id)?.color === col);
            if (sel.length >= cureThreshold) return col as DiseaseColor;
          }
          return null;
        })();

        return (
          <div style={{
            marginBottom: 6, padding: "8px 14px",
            background: "#0a1520", border: `1px solid ${pColor}55`,
            borderRadius: 6, fontFamily: "system-ui, sans-serif", fontSize: 12,
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: pColor, flexShrink: 0 }} />
              <span style={{ color: pColor, fontWeight: 700 }}>{playerName}</span>
            </div>
            {turnState.phase === "actions" && (
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: Math.max(roleId === 'generalist' ? 5 : 4, turnState.actionsRemaining) }, (_, pi) => (
                  <div key={pi} style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: pi < turnState.actionsRemaining ? pColor : "#334",
                    border: `1px solid ${pColor}88`,
                  }} />
                ))}
              </div>
            )}
            <span style={{ color: "#8ab", flex: 1 }}>{instruction}</span>
            {cureSelecting && canConfirmCure && (
              <button onClick={() => {
                const sel5 = selectedHandCards.filter(id => CITIES.find(c => c.id === id)?.color === canConfirmCure).slice(0, cureThreshold);
                const hand = currentPlayerHand();
                const newHand = hand.filter(id => !sel5.includes(id));
                saveHandCards({ ...handCards, [currentPlayerKey]: newHand });
                setPlayerDiscard(prev => [...prev, ...sel5]);
                const ci = COLOR_TO_CURE_IDX[canConfirmCure]!;
                setCured(prev => { const n = [...prev]; n[ci] = true; return n; });
                setCureSelecting(false); setSelectedHandCards([]);
                saveTurnState(consumeAction(turnState));
              }} style={{
                padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer",
                background: "#1a3a1a", border: "1px solid #4a9a4a", color: "#88dd88",
              }}>Confirm Cure</button>
            )}
            {cureSelecting && (
              <button onClick={() => { setCureSelecting(false); setSelectedHandCards([]); }}
                style={{ padding: "3px 8px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#2a1a1a", border: "1px solid #884444", color: "#cc8888" }}>
                Cancel
              </button>
            )}
            {turnState.phase === "actions" && !cureSelecting && (
              <button onClick={() => saveTurnState({ ...turnState, actionsRemaining: 0, phase: "draw", drawCount: 0 })}
                style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#111e2e", border: "1px solid #336", color: "#778" }}>
                Skip Turn
              </button>
            )}
            {turnState.phase === "discard" && (() => {
              const hand = currentPlayerHand();
              return hand.length <= 7 ? (
                <button onClick={() => saveTurnState({ ...turnState, phase: "infect", infectCount: 0 })}
                  style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#1a3a1a", border: "1px solid #4a9a4a", color: "#88dd88" }}>
                  Continue →
                </button>
              ) : null;
            })()}
            {turnState.phase === "infect" && infectionDone && !quietNight && (
              <button onClick={advanceTurn}
                style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#1a2a1a", border: "1px solid #4a7a4a", color: "#88cc88" }}>
                End Infection →
              </button>
            )}
            {turnState.phase === "infect" && quietNight && (
              <button onClick={() => { setQuietNight(false); advanceTurn(); }}
                style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#1a2a3a", border: "1px solid #4a7aaa", color: "#88aadd" }}>
                Skip Infect Cities →
              </button>
            )}
            {eventMode === 'flexible-aid' && flexibleAidSelected.length >= 1 && pendingEventCard && (
              <button onClick={() => {
                // Single hand update removes BOTH the selected city cards AND the
                // fund (event) card. Doing this in one saveHandCards avoids the
                // stale-closure race where a separate resolveEventCard call would
                // re-read the pre-update hand and clobber the city-card removal.
                const current = (handCards as Record<string,string[]>)[pendingEventCard.player] ?? [];
                let removedEvent = false;
                const newHand = current.filter(id => {
                  if (flexibleAidSelected.includes(id)) return false;
                  if (!removedEvent && id === pendingEventCard.cardId) { removedEvent = true; return false; }
                  return true;
                });
                saveHandCards({ ...handCards, [pendingEventCard.player]: newHand });
                setPlayerDiscard(prev => [...prev, ...flexibleAidSelected, pendingEventCard.cardId]);
                saveTurnState({ ...turnState, actionsRemaining: turnState.actionsRemaining + flexibleAidSelected.length });
                setEventMode(null); setFlexibleAidSelected([]); setPendingEventCard(null);
              }} style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#1a3a1a", border: "1px solid #4a9a4a", color: "#88dd88" }}>
                Confirm (+{flexibleAidSelected.length})
              </button>
            )}
            {(eventMode === 'remote-treatment' || eventMode === 'govt-grant' || eventMode === 'airlift' || eventMode === 'flexible-aid' || eventMode === 'resilient-pop') && (
              <button onClick={() => {
                // Restore any cubes already removed by an in-progress Remote Treatment.
                if (eventMode === 'remote-treatment' && cubeSnapshotRef.current) saveCityInfection(cubeSnapshotRef.current);
                cubeSnapshotRef.current = null;
                setEventMode(null); setHighlightCities([]); setAirliftPawn(null);
                setFlexibleAidSelected([]); setEventModeRemaining(0); setPendingEventCard(null);
                setShowDiscardPopup(false);
              }} style={{ padding: "3px 8px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#2a1a1a", border: "1px solid #884444", color: "#cc8888" }}>
                Cancel
              </button>
            )}
          </div>
        );
      })()}

      {(eventMode || quietNight) && (
        <div style={{ textAlign: "center", fontSize: 11, fontFamily: "monospace", marginBottom: 4, color: "#aac" }}>
          {quietNight && turnState.phase === "infect" ? "One Quiet Night active"
            : eventMode === 'govt-grant' ? "Government Grant — click a city"
            : eventMode === 'remote-treatment' ? `Remote Treatment — click a city (${eventModeRemaining} left)`
            : eventMode === 'airlift' && !airliftPawn ? "Airlift — tap a pawn"
            : eventMode === 'airlift' && airliftPawn ? "Airlift — click any city"
            : eventMode === 'resilient-pop' ? "Resilient Population — click a card in the popup to remove it from the game"
            : eventMode === 'flexible-aid' ? `Flexible Aid — tap city cards (${flexibleAidSelected.length}/3)`
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
        {calibrating && (
          <>
            <button onClick={() => {
              const text = [
                `token p1: { x: ${tokenP1.x.toFixed(2)}, y: ${tokenP1.y.toFixed(2)}, w: ${tokenP1.w.toFixed(2)} }`,
                `token p2: { x: ${tokenP2.x.toFixed(2)}, y: ${tokenP2.y.toFixed(2)}, w: ${tokenP2.w.toFixed(2)} }`,
              ].join("\n");
              navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => window.prompt("Tokens", text));
            }}>Copy tokens</button>
            <span style={{ color: "#9ab", fontSize: 12, alignSelf: "center" }}>Drag to move · drag ↘ corner to resize</span>
          </>
        )}
      </div>

      <div
        ref={boardRef}
        onClick={handleBoardClick}
        onContextMenu={e => e.preventDefault()}
        style={{
          position: "relative",
          width: "100%",
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
        <CityLayer
          roadblocks={roadblocks}
          onRoadblockChange={rb => { setRoadblocks(rb); saveRoadblocks(rb); }}
          onCityClick={calibrating ? undefined : (cityId) => handleCityClick(cityId)}
          onCityRightClick={calibrating ? undefined : (cityId, e) => {
            if (e.type === "contextmenu") {
              e.preventDefault();
              // City context menu only available in sandbox board mode, pre-game
              if (setup || scenario !== "board") return;
              setCityMenu({ cityId, x: e.clientX, y: e.clientY });
            }
          }}
          highlightCities={highlightCities.length > 0 ? highlightCities : undefined}
          highlightClickOnly={turnState.pendingShuttle}
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

        {/* 96 draggable disease cubes (24 per color) — front cubes hidden when placed on cities */}
        {cubes.map((cube, i) => {
          const ci = Math.floor(i / 24);
          const j = i % 24;
          if (j >= 24 - Math.min(24, placedPerColor[ci])) return null;
          const color = CUBE_COLORS[ci];
          const onCubeDown = (e: React.PointerEvent<HTMLDivElement>) => {
            if (calibrating) return;
            e.stopPropagation();
            e.preventDefault();
            const el = e.currentTarget; el.setPointerCapture(e.pointerId);
            const z = ++zCounter.current;
            setCubeZ(prev => { const n = [...prev]; n[i] = z; return n; });
            const r = boardRef.current!.getBoundingClientRect();
            const sx = e.clientX; const sy = e.clientY; const ox = cube.x; const oy = cube.y;
            const onMove = (ev: PointerEvent) => {
              const nx = ox + ((ev.clientX - sx) / r.width) * 100;
              const ny = oy + ((ev.clientY - sy) / r.height) * 100;
              setCubes(prev => { const n = [...prev]; n[i] = { x: nx, y: ny }; return n; });
            };
            const onUp = () => {
              el.removeEventListener("pointermove", onMove as any);
              el.removeEventListener("pointerup", onUp);
              setCubes(prev => prev);
            };
            el.addEventListener("pointermove", onMove as any); el.addEventListener("pointerup", onUp);
          };
          return (
            <div key={`cube-${i}`} onPointerDown={onCubeDown} style={{
              position: "absolute",
              left: `${cube.x}%`, top: `${cube.y}%`,
              width: `${CUBE_W}%`, aspectRatio: "1",
              transform: "translate(-50%, -50%)",
              cursor: calibrating ? "default" : "grab",
              zIndex: cubeZ[i] + 5,
              touchAction: "none", userSelect: "none",
            }}>
              <CubeSvg color={color} />
            </div>
          );
        })}

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
                onClick={isTop && !calibrating && !onChooseRoles ? drawInfectionCard : undefined}
                onContextMenu={isTop && !calibrating ? (e) => { e.preventDefault(); setDeckMenu({ x: e.clientX, y: e.clientY }); } : undefined}
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

        {/* Player deck ghost — always-present right-click target even when deck is empty */}
        <div
          onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setPlayerDeckMenu({ x: e.clientX, y: e.clientY }); }}
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

            const onTopDown = isTop && !calibrating ? (e: React.PointerEvent<HTMLDivElement>) => {
              if (e.button !== 0) return;
              e.stopPropagation(); e.preventDefault();
              const el = e.currentTarget; el.setPointerCapture(e.pointerId);
              const r = boardRef.current!.getBoundingClientRect();
              const startX = e.clientX; const startY = e.clientY;
              let moved = false;
              const deck = playerDeck; const disc = playerDiscard;
              const toPct = (ev: PointerEvent) => ({
                x: ((ev.clientX - r.left) / r.width) * 100,
                y: ((ev.clientY - r.top) / r.height) * 100,
              });
              const onMove = (ev: PointerEvent) => {
                if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) moved = true;
                if (moved) setPlayerDrag({ cityId, ...toPct(ev) });
              };
              const onUp = (ev: PointerEvent) => {
                el.removeEventListener("pointermove", onMove as any);
                el.removeEventListener("pointerup", onUp);
                setPlayerDrag(null);
                if (!moved) {
                  // tap = flip
                  setPlayerFlipped(prev => {
                    const n = new Set(prev);
                    if (n.has(cityId)) n.delete(cityId); else n.add(cityId);
                    return n;
                  });
                  return;
                }
                // dragged — allow drop to hand (face-down or face-up) or discard (face-up only)
                const pos = toPct(ev);
                const nearDiscard = Math.abs(pos.x - cardPlayerDiscard.x) < 10 && Math.abs(pos.y - cardPlayerDiscard.y) < 10;
                // Detect which of the 4 hand areas received the drop (2×2 layout, split at y=51)
                const leftSide = pos.x < 5; const rightSide = pos.x > 95; const topHalf = pos.y < 51;
                const droppedHand: string | null = leftSide ? (topHalf ? 'p1' : 'p3') : rightSide ? (topHalf ? 'p2' : 'p4') : null;
                const inDrawPhase = setup && turnState.phase === "draw" && faceUp;
                const completeOneDraw = () => {
                  if (!inDrawPhase) return;
                  const newCount = turnState.drawCount + 1;
                  if (newCount >= 2) {
                    // Check hand limit
                    const hand = (handCards as Record<string,string[]>)[currentPlayerKey] ?? [];
                    const phase: TurnPhase = (hand.length + (cityId !== "epidemic" ? 1 : 0)) > 7 ? "discard" : "infect";
                    saveTurnState({ ...turnState, drawCount: newCount, phase, infectCount: 0 });
                  } else {
                    saveTurnState({ ...turnState, drawCount: newCount });
                  }
                };
                if (faceUp && nearDiscard && !onChooseRoles) {
                  setPlayerDeck(deck.slice(0, -1)); setPlayerDiscard([...disc, cityId]);
                  setPlayerFlipped(prev => { const n = new Set(prev); n.delete(cityId); return n; });
                  if (inDrawPhase && cityId === "epidemic") completeOneDraw(); // epidemic dragged to discard counts
                } else if (droppedHand) {
                  // In deal phase: enforce deal order — cannot skip a player
                  if (onChooseRoles) {
                    const playerIdx = ['p1','p2','p3','p4'].indexOf(droppedHand);
                    if (playerIdx > maxDealTargetIdx) return; // bounce — must deal to lower-numbered player first
                  }
                  const player = inDrawPhase ? currentPlayerKey : droppedHand;
                  setPlayerDeck(deck.slice(0, -1));
                  setPlayerFlipped(prev => { const n = new Set(prev); n.delete(cityId); return n; });
                  const dest = (handCards as Record<string,string[]>)[player] ?? [];
                  saveHandCards({ ...handCards, [player]: [...dest, cityId] });
                  completeOneDraw();
                }
              };
              el.addEventListener("pointermove", onMove as any);
              el.addEventListener("pointerup", onUp);
            } : (isTop ? onDragDown : undefined);

            return (
              <div key={`player-deck-${i}`}
                onPointerDown={onTopDown}
                onContextMenu={isTop && !calibrating ? e => { e.preventDefault(); e.stopPropagation(); setPlayerDeckMenu({ x: e.clientX, y: e.clientY }); } : undefined}
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
                {faceUp && pxW > 0
                  ? (isEpidemic
                      ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden" }}><img src={epidemicCardSrc} alt="Epidemic" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block", pointerEvents: "none" }} /></div>
                      : isFunding
                      ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden", position: "relative" }}><img src={FUND_IMGS[cityId]} draggable={false} style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block", pointerEvents: "none" }} /></div>
                      : <PlayerCard city={city!} width={pxW} />)
                  : <img src={playerCardBackSrc} alt="" draggable={false}
                      style={{ width: "100%", height: "auto", display: "block", userSelect: "none", pointerEvents: "none" }} />
                }
                {calibrating && isTop && (
                  <div onPointerDown={onResizeDown}
                    style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, background: "#fff", cursor: "se-resize" }} />
                )}
              </div>
            );
          });
        })()}

        {/* Epidemic standalone pile — hidden (epidemicCount used only for shuffle logic) */}
        {false && epidemicCount > 0 && boardPxW > 0 && (() => {
          const card = cardPlayer;
          const eStep = 0.06;
          const epidemicFaceUp = playerFlipped.has("epidemic");
          const onTopDown = (e: React.PointerEvent<HTMLDivElement>) => {
            if (calibrating || e.button !== 0) return;
            e.stopPropagation(); e.preventDefault();
            const el = e.currentTarget; el.setPointerCapture(e.pointerId);
            const r = boardRef.current!.getBoundingClientRect();
            const toPct = (ev: PointerEvent) => ({ x: ((ev.clientX - r.left) / r.width) * 100, y: ((ev.clientY - r.top) / r.height) * 100 });
            let moved = false;
            const sx = e.clientX; const sy = e.clientY;
            const onMove = (ev: PointerEvent) => {
              if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) moved = true;
              if (moved && epidemicFaceUp) setPlayerDrag({ cityId: "epidemic", ...toPct(ev) });
            };
            const onUp = (ev: PointerEvent) => {
              el.removeEventListener("pointermove", onMove as any);
              el.removeEventListener("pointerup", onUp);
              setPlayerDrag(null);
              if (!moved) {
                if (!epidemicFaceUp) {
                  // Flip face-up → trigger epidemic sequence
                  setPlayerFlipped(prev => { const n = new Set(prev); n.add("epidemic"); return n; });
                  triggerEpidemic();
                } else {
                  setPlayerFlipped(prev => { const n = new Set(prev); n.delete("epidemic"); return n; });
                }
                return;
              }
              if (!epidemicFaceUp) return;
              const pos = toPct(ev);
              const nearDiscard = Math.abs(pos.x - cardPlayerDiscard.x) < 10 && Math.abs(pos.y - cardPlayerDiscard.y) < 10;
              const leftSide2 = pos.x < 5; const rightSide2 = pos.x > 95; const topHalf2 = pos.y < 51;
              const epicHand: string | null = leftSide2 ? (topHalf2 ? 'p1' : 'p3') : rightSide2 ? (topHalf2 ? 'p2' : 'p4') : null;
              if (nearDiscard) {
                setEpidemicCount(c => c - 1);
                setPlayerFlipped(prev => { const n = new Set(prev); n.delete("epidemic"); return n; });
                setPlayerDiscard(prev => [...prev, "epidemic"]);
              } else if (epicHand) {
                setEpidemicCount(c => c - 1);
                setPlayerFlipped(prev => { const n = new Set(prev); n.delete("epidemic"); return n; });
                const dest = (handCards as Record<string,string[]>)[epicHand] ?? [];
                saveHandCards({ ...handCards, [epicHand]: [...dest, "epidemic"] });
              }
            };
            el.addEventListener("pointermove", onMove as any);
            el.addEventListener("pointerup", onUp);
          };
          // Epidemic pile sits below the player deck — base is card height below deck centre
          const cardH = (card.w / 100) * (3.5 / 2.5) / BOARD_RATIO * 100; // % board height
          const baseDown = cardH * 0.85; // shift down ~85% of one card height
          return Array.from({ length: epidemicCount }, (_, i) => {
            const isTop = i === epidemicCount - 1;
            const offset = i * eStep;
            return (
              <div key={`epidemic-${i}`}
                onPointerDown={isTop ? onTopDown : undefined}
                onContextMenu={isTop ? e => { e.preventDefault(); e.stopPropagation(); setPlayerDeckMenu({ x: e.clientX, y: e.clientY }); } : undefined}
                style={{
                  position: "absolute",
                  left: `${card.x + offset}%`,
                  top: `${card.y + baseDown + offset * BOARD_RATIO}%`,
                  width: `${card.w}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 7 + i,  /* below player deck (zIndex 9+) */
                  cursor: isTop ? (epidemicFaceUp ? "grab" : "pointer") : "default",
                  touchAction: "none", userSelect: "none",
                  opacity: isTop && playerDrag?.cityId === "epidemic" ? 0.25 : 1,
                }}>
                {isTop && epidemicFaceUp
                  ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden" }}><img src={epidemicCardSrc} alt="Epidemic" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block", pointerEvents: "none" }} /></div>
                  : <img src={playerCardBackSrc} alt="" draggable={false} style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }} />
                }
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
                onContextMenu={isTop && !calibrating ? (e) => { e.preventDefault(); setDiscardMenu({ x: e.clientX, y: e.clientY }); } : undefined}
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
                <InfectionCard city={city} width={pxW} />
              </div>
            );
          });
        })()}

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
          return (
            <div key={`rs-${city.id}`} onPointerDown={onDragDown}
              onClick={e => {
                if (!isPlayerRS) return;
                e.stopPropagation();
                // Check available actions
                const canShuttle = researchStations.size > 1;
                const hand = currentPlayerHand();
                const canCure = DISEASE_COLORS.some(col => {
                  const ci = COLOR_TO_CURE_IDX[col]; if (ci === undefined || cured[ci]) return false;
                  return hand.filter(id => CITIES.find(c2 => c2.id === id)?.color === col).length >= cureThreshold;
                });
                if (!canShuttle && !canCure) return;
                setRsActionMenu({ cityId: city.id, x: e.clientX, y: e.clientY });
              }}
              onContextMenu={e => {
                if (setup) return; // disable RS removal in game phase
                e.preventDefault(); e.stopPropagation();
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
                cursor: isPlayerRS ? "pointer" : calibrating ? "default" : "grab",
                touchAction: "none", userSelect: "none",
                boxShadow: isPlayerRS ? "0 0 0 2px #ffdd44, 0 0 10px 3px #ffdd4488" : "none",
              }}>
              <img src={researchSrc} alt="Research station" draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "fill", display: "block", pointerEvents: "none" }} />
            </div>
          );
        })}

        {/* Panic level stickers — rendered on each city's tray */}
        {CITIES.map(city => {
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
            <img src={objectiveSrc} alt="Objective" draggable={false}
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
            const onCardDown = (e: React.PointerEvent<HTMLDivElement>) => {
              if (calibrating) return;
              // In game phase: only current player can drag their own cards
              if (setup && player !== currentPlayerKey) {
                // Active player may take a card FROM a teammate's hand during their actions:
                //  • from a Researcher: any card (Researcher special)
                //  • from anyone else: only the card matching the active player's current city
                const teammateRole = setup.playerOrder[(['p1','p2','p3','p4'] as const).indexOf(player as 'p1'|'p2'|'p3'|'p4')]?.roleId;
                const isResearcher = teammateRole === 'researcher';
                const isMatchingTake = cityId === currentPlayerCityId;
                if (turnState.phase !== "actions" || (!isResearcher && !isMatchingTake)) return;
              }
              e.stopPropagation(); e.preventDefault();
              const el = e.currentTarget; el.setPointerCapture(e.pointerId);
              const r = boardRef.current!.getBoundingClientRect();
              const toPct = (ev: PointerEvent) => ({ x: ((ev.clientX - r.left) / r.width) * 100, y: ((ev.clientY - r.top) / r.height) * 100 });
              let moved = false;
              const sx = e.clientX; const sy = e.clientY;
              const onMove = (ev: PointerEvent) => {
                if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) moved = true;
                if (moved) { setHandDrag({ player, idx: i, ...toPct(ev) }); setHandHover(null); }
              };
              const onUp = (ev: PointerEvent) => {
                el.removeEventListener("pointermove", onMove as any);
                el.removeEventListener("pointerup", onUp);
                setHandDrag(null);
                if (!moved) {
                  // Tap: play fund event card (any phase, hand only)
                  if (setup && isFundingHand) {
                    playFundCard(player, i, cityId);
                    return;
                  }
                  // Tap: select city cards for Flexible Aid
                  if (setup && eventMode === 'flexible-aid' && player === pendingEventCard?.player && !isFundingHand && cityId !== 'epidemic') {
                    const city = CITIES.find(c => c.id === cityId);
                    if (city) {
                      setFlexibleAidSelected(prev =>
                        prev.includes(cityId) ? prev.filter(id => id !== cityId)
                        : prev.length < 3 ? [...prev, cityId] : prev
                      );
                    }
                    return;
                  }
                  // Tap: toggle card selection for cure (game phase only)
                  if (setup && cureSelecting) {
                    setSelectedHandCards(prev =>
                      prev.includes(cityId) ? prev.filter(id => id !== cityId) : [...prev, cityId]
                    );
                  }
                  return;
                }
                const pos = toPct(ev);
                const current = (handCards as Record<string,string[]>)[player] ?? [];
                const nearDiscard = Math.abs(pos.x - cardPlayerDiscard.x) < 10 && Math.abs(pos.y - cardPlayerDiscard.y) < 10;
                // Determine all player hand areas for target detection (check both x and y proximity)
                const HAND_AREAS: Record<string, typeof HAND_P1> = { p1: HAND_P1, p2: HAND_P2, p3: HAND_P3, p4: HAND_P4 };
                const otherPlayer = (activePlayers as readonly string[]).find(pk =>
                  pk !== player &&
                  Math.abs(pos.x - HAND_AREAS[pk].x) < 8 &&
                  Math.abs(pos.y - HAND_AREAS[pk].y) < 30
                );

                if (nearDiscard && setup && turnState.phase === "actions") {
                  // Game phase: intercept discard for flight/build actions
                  const isFundCard = FUND_IMGS[cityId] !== undefined;
                  const isEpidemicCard = cityId === "epidemic";
                  if (!isFundCard && !isEpidemicCard) {
                    if (cityId === currentPlayerCityId) {
                      // Charter Flight or Build Research Station — show popup
                      setPendingDiscardMenu({ cityId, player, idx: i, x: ev.clientX, y: ev.clientY });
                      return;
                    } else {
                      // Direct Flight — fly to card's city
                      const destCity = CITIES.find(c => c.id === cityId);
                      if (destCity) {
                        const nextCities = [...playerCities]; nextCities[turnState.currentPlayerIndex] = cityId;
                        savePlayerCities(nextCities); snapPawnToCity(player, cityId);
                        saveHandCards({ ...handCards, [player]: current.filter((_, j) => j !== i) });
                        setPlayerDiscard(prev => [...prev, cityId]);
                        saveTurnState(consumeAction(turnState));
                        return;
                      }
                    }
                  }
                  // Fund/epidemic card: plain discard
                  saveHandCards({ ...handCards, [player]: current.filter((_, j) => j !== i) });
                  setPlayerDiscard(prev => [...prev, cityId]);
                  return;
                }

                if (nearDiscard && !setup) {
                  // Pre-game: free discard
                  saveHandCards({ ...handCards, [player]: current.filter((_, j) => j !== i) });
                  setPlayerDiscard(prev => [...prev, cityId]);
                  return;
                }

                if (setup && turnState.phase === "actions") {
                  // Take: active player dragging a teammate's card TO their own hand.
                  // Researcher → any card; anyone else → only the card matching the active player's city.
                  if (player !== currentPlayerKey && otherPlayer === currentPlayerKey) {
                    const teammateIdx = (['p1','p2','p3','p4'] as const).indexOf(player as 'p1'|'p2'|'p3'|'p4');
                    const teammateCity = playerCities[teammateIdx] ?? "atlanta";
                    const teammateRole = setup.playerOrder[teammateIdx]?.roleId;
                    const legal = teammateCity === currentPlayerCityId &&
                      (teammateRole === 'researcher' || cityId === currentPlayerCityId);
                    if (legal) {
                      const myCards = (handCards as Record<string,string[]>)[currentPlayerKey] ?? [];
                      saveHandCards({ ...handCards, [player]: current.filter((_, j) => j !== i), [currentPlayerKey]: [...myCards, cityId] });
                      saveTurnState(consumeAction(turnState));
                    }
                    return;
                  }
                  if (otherPlayer) {
                    // Share Knowledge: valid if both players in same city and card matches giver's city
                    const giverCity = currentPlayerCityId;
                    const receiverIdx = (['p1','p2','p3','p4'] as const).indexOf(otherPlayer as 'p1'|'p2'|'p3'|'p4');
                    const receiverCity = playerCities[receiverIdx] ?? "atlanta";
                    const valid = giverCity === receiverCity && cityId === giverCity;
                    if (valid) {
                      const receiverCards = (handCards as Record<string,string[]>)[otherPlayer] ?? [];
                      saveHandCards({ ...handCards, [player]: current.filter((_, j) => j !== i), [otherPlayer]: [...receiverCards, cityId] });
                      saveTurnState(consumeAction(turnState));
                      return;
                    }
                    return;
                  }
                }

                if (otherPlayer && !setup) {
                  // Pre-game free transfer between hands
                  const destCards = (handCards as Record<string,string[]>)[otherPlayer] ?? [];
                  saveHandCards({ ...handCards, [player]: current.filter((_, j) => j !== i), [otherPlayer]: [...destCards, cityId] });
                  return;
                }

                // Reorder within same hand
                const area = HAND_AREAS[player as keyof typeof HAND_AREAS] ?? HAND_P1;
                const areaT = area.y - area.h / 2;
                const so = handStackOffset(area, current.length);
                const targetIdx = Math.max(0, Math.min(current.length - 1, Math.round((pos.y - areaT) / (so || 1))));
                if (targetIdx !== i) {
                  const next = [...current]; next.splice(i, 1); next.splice(targetIdx, 0, cityId);
                  saveHandCards({ ...handCards, [player]: next });
                }
              };
              el.addEventListener("pointermove", onMove as any);
              el.addEventListener("pointerup", onUp);
            };
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
                  transform: "translateX(-50%)",
                  zIndex: 15 + i,
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
                  ? <div style={{ width: "100%", aspectRatio: "2.5/3.5", overflow: "hidden", position: "relative" }}><img src={FUND_IMGS[cityId]} draggable={false} style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", display: "block", pointerEvents: "none" }} /></div>
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
              if (!setup || turnState.phase !== "actions") return;
              const pi = (['p1','p2','p3','p4'] as const).indexOf(key as 'p1'|'p2'|'p3'|'p4');
              const moved = Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6;
              if (!moved) {
                // Tap: Airlift pawn-select
                if (eventMode === 'airlift') {
                  if (airliftPawn === key) { setAirliftPawn(null); setHighlightCities([]); }
                  else { setAirliftPawn(key); setHighlightCities(CITIES.map(c => c.id)); }
                  save({ ...t, x: ox, y: oy }); return;
                }
                // Tap: Dispatcher transport-select
                if (roleId === 'dispatcher') {
                  if (dispatcherTarget === key) {
                    setDispatcherTarget(null); setHighlightCities([]);
                  } else {
                    setDispatcherTarget(key);
                    const targets = playerCities
                      .map((cid, idx) => idx !== pi ? cid : null)
                      .filter(Boolean) as string[];
                    setHighlightCities([...new Set(targets)]);
                  }
                }
                save({ ...t, x: ox, y: oy });
                return;
              }
              // Only current player can initiate a drag-move; Dispatcher can drag any pawn
              if (key !== currentPlayerKey && roleId !== 'dispatcher') { save({ ...t, x: ox, y: oy }); return; }
              const dropX = ox + ((ev.clientX - sx) / r.width) * 100;
              const dropY = oy + ((ev.clientY - sy) / r.height) * 100;
              const targetId = nearestCity(dropX, dropY);
              const movedPawnCityId = playerCities[pi] ?? "atlanta";
              const movedPawnCity = CITIES.find(c2 => c2.id === movedPawnCityId);
              const isNeighbor = targetId && (movedPawnCity?.neighbors.includes(targetId) ?? false);
              if (isNeighbor && targetId) {
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
          return (
            <div key={key} onPointerDown={onDragDown}
              style={{
                position: "absolute",
                left: `${t.x}%`, top: `${t.y}%`,
                width: `${t.w}%`, height: `${aspectH}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 25,
                cursor: calibrating ? "default" : "grab",
                outline: calibrating ? "2px dashed #fff" : "none",
                boxSizing: "border-box",
                touchAction: "none", userSelect: "none",
                filter: "drop-shadow(0 3px 6px #0008)",
              }}>
              <svg viewBox="0 0 100 150" style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }}>
                <path d="M 36,50 C 18,68 10,105 12,132 Q 12,148 50,148 Q 88,148 88,132 C 90,105 82,68 64,50 Z" fill={color} stroke={color === "#f0f0f0" ? "#999" : "none"} strokeWidth={color === "#f0f0f0" ? 1.5 : 0} />
                <ellipse cx="50" cy="50" rx="15" ry="8" fill={color} />
                <circle cx="50" cy="28" r="24" fill={color} stroke={color === "#f0f0f0" ? "#999" : "none"} strokeWidth={color === "#f0f0f0" ? 1.5 : 0} />
                <circle cx="40" cy="20" r="7" fill="rgba(255,255,255,0.30)" />
              </svg>
              {calibrating && (
                <div onPointerDown={onResizeDown}
                  style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, background: "#fff", cursor: "se-resize" }} />
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
          const iconY = area.y - area.h / 2 - 10;
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
                    style={{ width: 180, height: "auto", borderRadius: 10, boxShadow: "0 8px 36px #000e", display: "block", userSelect: "none" }}
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
              eradicated={ci >= 0 ? eradicated[ci] : false}
              eradicatedColor={m.tintColor === "#FFFA73" ? "#666" : "white"}
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
          <div onClick={() => { setCityMenu(null); setCityMenuHover(null); }}
            style={{ position: "fixed", inset: 0, zIndex: 999 }}>
            <div onClick={e => e.stopPropagation()}
              style={{ position: "fixed", left: cityMenu.x, top: cityMenu.y, ...menuStyle, padding: 3 }}>

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

            </div>
          </div>
        );
      })()}

      {/* Objective card context menu */}
      {objMenu && (
        <div onClick={() => setObjMenu(null)}
          style={{ position: "fixed", inset: 0, zIndex: 999 }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", left: objMenu.x, top: objMenu.y,
              background: "#1a2550", border: "1px solid #445", borderRadius: 6,
              boxShadow: "0 4px 16px #000a", zIndex: 1000, minWidth: 150, overflow: "hidden",
            }}>
            {[
              {
                label: objectiveCompleted[objMenu.idx] ? "✓ Completed" : "Completed",
                action: () => {
                  setObjectiveCompleted(prev => { const n = [...prev]; n[objMenu.idx] = !n[objMenu.idx]; return n; });
                  setObjMenu(null);
                },
              },
              {
                label: "Destroy",
                action: () => {
                  const idx = objMenu.idx;
                  setObjectiveCompleted(prev => { const n = [...prev]; n.splice(idx, 1); return n; });
                  setObjectiveCount(prev => prev - 1);
                  setObjMenu(null);
                },
                color: "#f66",
              },
            ].map(({ label, action, color }) => (
              <div key={label} onClick={action}
                style={{ padding: "10px 16px", color: color ?? "#cde", fontSize: 13, cursor: "pointer", fontFamily: "monospace" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#2a3d7a")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infection deck context menu */}
      {deckMenu && (
        <div onClick={() => setDeckMenu(null)}
          style={{ position: "fixed", inset: 0, zIndex: 999 }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", left: deckMenu.x, top: deckMenu.y,
              background: "#1a2550", border: "1px solid #445", borderRadius: 6,
              boxShadow: "0 4px 16px #000a", zIndex: 1000, minWidth: 140, overflow: "hidden",
            }}>
            {[
              { label: "Shuffle", action: shuffleDeck },
              { label: "Forecast", action: openForecast },
              { label: "Draw Bottom", action: () => {
                if (infectDeck.length === 0) return;
                const bottom = infectDeck[0];
                setInfectDeck(infectDeck.slice(1));
                setInfectDiscard(prev => [...prev, bottom]);
                setDeckMenu(null);
                if (epidemicState?.phase === 'infect') epidemicInfect(bottom);
              }},
            ].map(({ label, action }) => (
              <div key={label} onClick={action}
                style={{ padding: "10px 16px", color: "#cde", fontSize: 13, cursor: "pointer", fontFamily: "monospace" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#2a3d7a")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                {label}
              </div>
            ))}
          </div>
        </div>
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
        <div onClick={() => setDiscardMenu(null)}
          style={{ position: "fixed", inset: 0, zIndex: 999 }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", left: discardMenu.x, top: discardMenu.y,
              background: "#1a2550", border: "1px solid #445", borderRadius: 6,
              boxShadow: "0 4px 16px #000a", zIndex: 1000, minWidth: 140, overflow: "hidden",
            }}>
            <div
              onClick={shuffleDiscardOntoDeck}
              style={{
                padding: "10px 16px", color: "#cde", fontSize: 13, cursor: "pointer",
                fontFamily: "monospace",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#2a3d7a")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              Shuffle
            </div>
          </div>
        </div>
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
        <div onClick={() => setPlayerDeckMenu(null)}
          style={{ position: "fixed", inset: 0, zIndex: 999 }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", left: playerDeckMenu.x, top: playerDeckMenu.y,
              background: "#111418", borderRadius: 5,
              boxShadow: "0 4px 20px #000c", overflow: "hidden",
              fontFamily: "system-ui, sans-serif", fontSize: 12, minWidth: 120, padding: 3,
            }}>
            {[
              {
                label: "Recall",
                action: () => {
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
                },
              },
              {
                label: "Shuffle",
                action: () => {
                  // Count ALL epidemics: standalone stack + any already embedded in deck
                  const embeddedEpidemics = playerDeck.filter(id => id === "epidemic").length;
                  const totalEpidemics = epidemicCount + embeddedEpidemics;
                  const cityCards = shuffle(playerDeck.filter(id => id !== "epidemic"));
                  const numPiles = Math.max(1, Math.min(totalEpidemics || 5, 5));
                  const base = Math.floor(cityCards.length / numPiles);
                  const extras = cityCards.length % numPiles;
                  // Build piles (extras piles get one extra card)
                  const piles: string[][] = [];
                  let idx = 0;
                  for (let p = 0; p < numPiles; p++) {
                    const size = base + (p < extras ? 1 : 0);
                    piles.push(cityCards.slice(idx, idx + size));
                    idx += size;
                  }
                  // Insert 1 epidemic per pile at a random position, then shuffle the pile
                  // so the epidemic's position is fully random (prevents it from sitting at top)
                  for (let p = 0; p < numPiles && p < totalEpidemics; p++) {
                    const at = Math.floor(Math.random() * (piles[p].length + 1));
                    piles[p].splice(at, 0, "epidemic");
                    piles[p] = shuffle(piles[p]);
                  }
                  // Sort ascending by size (smaller piles at bottom = drawn last)
                  piles.sort((a, b) => a.length - b.length);
                  setPlayerDeck(piles.flat());
                  setEpidemicCount(0);
                  setPlayerFlipped(new Set());
                  setPlayerDeckMenu(null);
                },
              },
            ].map(({ label, action }) => (
              <div key={label} onClick={action}
                style={{ padding: "8px 14px", color: "#e8e8e8", cursor: "pointer", borderRadius: 3 }}
                onMouseEnter={e => { e.currentTarget.style.background = "#23282f"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player discard card context menu — send to hand */}
      {discardCardMenu && (
        <div onClick={() => setDiscardCardMenu(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1100 }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", left: discardCardMenu.x, top: discardCardMenu.y,
              background: "#111418", borderRadius: 5,
              boxShadow: "0 4px 20px #000c", overflow: "hidden",
              fontFamily: "system-ui, sans-serif", fontSize: 12, minWidth: 110,
            }}>
            {discardCardMenu.cityId === "epidemic"
              ? (
                <div onClick={() => {
                  setPlayerDiscard(prev => prev.filter(id => id !== "epidemic"));
                  setEpidemicCount(c => c + 1);
                  setPlayerFlipped(prev => { const n = new Set(prev); n.delete("epidemic"); return n; });
                  setDiscardCardMenu(null);
                }}
                  style={{ padding: "8px 14px", color: "#e8e8e8", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#23282f"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  Return to deck
                </div>
              )
              : (['p1', 'p2'] as const).map(player => (
              <div key={player}
                onClick={() => {
                  const cityId = discardCardMenu.cityId;
                  setPlayerDiscard(prev => prev.filter(id => id !== cityId));
                  saveHandCards({ ...handCards, [player]: [...handCards[player], cityId] });
                  setDiscardCardMenu(null);
                }}
                style={{ padding: "8px 14px", color: "#e8e8e8", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#23282f"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                {player === 'p1' ? 'Player 1' : 'Player 2'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charter Flight / Build Research Station popup */}
      {pendingDiscardMenu && (
        <div onClick={() => setPendingDiscardMenu(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1100 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: "fixed", left: pendingDiscardMenu.x, top: pendingDiscardMenu.y,
              background: "#111418", borderRadius: 5, boxShadow: "0 4px 20px #000c",
              overflow: "hidden", fontFamily: "system-ui, sans-serif", fontSize: 12, minWidth: 160 }}>
            {[
              {
                label: "Charter Flight",
                action: () => {
                  // Discard card, set pendingCharter, highlight all cities
                  const { player, idx, cityId } = pendingDiscardMenu;
                  const current = (handCards as Record<string,string[]>)[player] ?? [];
                  saveHandCards({ ...handCards, [player]: current.filter((_, j) => j !== idx) });
                  setPlayerDiscard(prev => [...prev, cityId]);
                  setHighlightCities(CITIES.map(c => c.id));
                  saveTurnState({ ...turnState, pendingCharter: true });
                  setPendingDiscardMenu(null);
                },
              },
              {
                label: `Build Research Station${researchStations.has(pendingDiscardMenu.cityId) ? " (already here)" : researchStations.size >= 6 ? " (pool empty)" : ""}`,
                disabled: researchStations.has(pendingDiscardMenu.cityId) || researchStations.size >= 6,
                action: () => {
                  const { player, idx, cityId } = pendingDiscardMenu;
                  const current = (handCards as Record<string,string[]>)[player] ?? [];
                  saveHandCards({ ...handCards, [player]: current.filter((_, j) => j !== idx) });
                  setPlayerDiscard(prev => [...prev, cityId]);
                  const next = new Set(researchStations); next.add(cityId);
                  setResearchStations(next);
                  localStorage.setItem(LS_RESEARCH_STATIONS, JSON.stringify([...next]));
                  saveTurnState(consumeAction(turnState));
                  setPendingDiscardMenu(null);
                },
              },
            ].map(({ label, action, disabled }) => (
              <div key={label} onClick={disabled ? undefined : action}
                style={{ padding: "9px 14px", color: disabled ? "#555" : "#e8e8e8", cursor: disabled ? "default" : "pointer" }}
                onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "#23282f"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RS Action menu — Shuttle Flight / Discover Cure */}
      {rsActionMenu && (
        <div onClick={() => setRsActionMenu(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1100 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: "fixed", left: rsActionMenu.x, top: rsActionMenu.y,
              background: "#111418", borderRadius: 5, boxShadow: "0 4px 20px #000c",
              overflow: "hidden", fontFamily: "system-ui, sans-serif", fontSize: 12, minWidth: 150 }}>
            {researchStations.size > 1 && (
              <div onClick={() => {
                const otherRS = [...researchStations].filter(id => id !== currentPlayerCityId);
                setHighlightCities(otherRS);
                saveTurnState({ ...turnState, pendingShuttle: true });
                setRsActionMenu(null);
              }}
                style={{ padding: "9px 14px", color: "#e8e8e8", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#23282f"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                Shuttle Flight
              </div>
            )}
            {(() => {
              const hand = currentPlayerHand();
              const cureColor = DISEASE_COLORS.find(col => {
                const ci = COLOR_TO_CURE_IDX[col]; if (ci === undefined || cured[ci]) return false;
                return hand.filter(id => CITIES.find(c => c.id === id)?.color === col).length >= cureThreshold;
              });
              if (!cureColor) return null;
              return (
                <div onClick={() => {
                  setCureSelecting(true); setSelectedHandCards([]);
                  setRsActionMenu(null);
                }}
                  style={{ padding: "9px 14px", color: "#e8e8e8", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#23282f"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  Discover Cure
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Win / Lose overlay */}
      {gameResult !== null && gameResult !== dismissedResult && (
        <GameOverOverlay
          result={gameResult}
          loseReason={loseReason}
          onContinue={() => setDismissedResult(gameResult)}
          onRestart={onRestart}
          onMainMenu={onMainMenu}
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
    </div>
  );
}
