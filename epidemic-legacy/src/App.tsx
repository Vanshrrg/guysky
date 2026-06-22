import { useState } from "react";
import { GameProvider } from "./state/GameContext";
import { DevPanel } from "./dev/DevPanel";
import { CharacterCalibrate } from "./board/CharacterCalibrate";
import { Board } from "./board/Board";
import { FundPhase, PreGamePhase, type PreGameSetup } from "./board/PreGamePhase";
import { CITIES } from "./board/cities";
import { shuffle } from "./board/boardGeometry";
import {
  LS_HAND_CARDS, LS_PLAYER_CITIES, LS_TURN, LS_RESEARCH_STATIONS,
  LS_PLAYER_DECK, LS_INFECT_DECK, LS_INFECT_DISCARD, LS_CITY_INFECTION,
  LS_EPIDEMIC_COUNT, LS_PANIC_LEVELS,
  clearGameState, clearAllSave, makeStorage, setActiveStorage,
} from "./board/boardStorage";

const FUND_CARD_IDS = ["fund1", "fund2", "fund3", "fund4", "fund5", "fund6", "fund7", "fund8"];

const SCENARIOS = [
  { id: "calibrate-jan", label: "Calibrate Board", built: true },
  { id: "month0", label: "Month 0", built: true },
  { id: "jan",    label: "January",   built: true },
  { id: "feb",    label: "February",  built: false },
  { id: "mar",    label: "March",     built: false },
  { id: "apr",    label: "April",     built: false },
  { id: "may",    label: "May",       built: false },
  { id: "jun",    label: "June",      built: false },
  { id: "jul",    label: "July",      built: false },
  { id: "aug",    label: "August",    built: false },
  { id: "sep",    label: "September", built: false },
  { id: "oct",    label: "October",   built: false },
  { id: "nov",    label: "November",  built: false },
  { id: "dec",    label: "December",  built: false },
];

// infection → fund ⇄ fund-view → deal → roles ⇄ roles-hidden → game
type Phase = "infection" | "fund" | "fund-view" | "deal" | "roles" | "roles-hidden" | "game";

function initialPhase(scenarioId: string): Phase {
  return scenarioId === "calibrate-jan" ? "game" : scenarioId === "board" ? "fund" : "infection";
}

export default function App() {
  const [showDev, setShowDev] = useState(false);
  const [showCharCal, setShowCharCal] = useState(false);
  const [setup, setSetup] = useState<PreGameSetup | null>(null);
  const [scenario, setScenario] = useState("month0");
  const [phase, setPhase] = useState<Phase>(() => initialPhase("month0"));
  const [resetKey, setResetKey] = useState(0);
  const [fundingCards, setFundingCards] = useState<string[]>([]);
  const [playerCount, setPlayerCount] = useState(2);

  const handleScenarioChange = (id: string) => {
    setScenario(id); setSetup(null); setFundingCards([]); setPlayerCount(2);
    setPhase(initialPhase(id)); setResetKey(k => k + 1);
  };

  const handleInfectionDone = () => setPhase("fund");

  const handleFundConfirm = (cards: string[]) => {
    setFundingCards(cards);
    setPhase("deal");
  };

  const handleChooseRoles = (count: number) => { setPlayerCount(count); setPhase("roles"); };
  const handleViewBoard    = () => setPhase("roles-hidden");
  const handleResumeRoles  = () => setPhase("roles");

  const handleSetup = (s: PreGameSetup) => { setSetup(s); setPhase("game"); };

  // Dev shortcut: skip infection/fund/deal/roles and drop straight into January,
  // actions phase, 2 players with a 4-card starting hand each — for exercising
  // the panic-level sandbox (right-click a city to set its panic level, then
  // test Direct/Charter Flight, Build Research Station, and Drive/Ferry gates).
  const handleQuickStartJan = () => {
    // Seed the dev namespace (calibrate-jan's storage slot) with a fresh game state.
    const dev = makeStorage("dev");
    setActiveStorage(dev);
    clearGameState();
    dev.remove(LS_PANIC_LEVELS);

    const deck = shuffle([...CITIES.map(c => c.id), ...FUND_CARD_IDS]);
    const hand1 = deck.splice(0, 4);
    const hand2 = deck.splice(0, 4);

    // Pre-seed the 9 initially infected cities (3 cubes × 3, 2 cubes × 3, 1 cube × 3)
    const infectDeck = shuffle(CITIES.map(c => c.id));
    const infectedCities = infectDeck.splice(0, 9);
    const cityInfection: Record<string, Record<string, number>> = {};
    infectedCities.forEach((cityId, i) => {
      const city = CITIES.find(c => c.id === cityId)!;
      const cubes = i < 3 ? 3 : i < 6 ? 2 : 1;
      cityInfection[cityId] = { [city.color]: cubes };
    });

    dev.set(LS_HAND_CARDS, JSON.stringify({ p1: hand1, p2: hand2, p3: [], p4: [] }));
    dev.set(LS_PLAYER_CITIES, JSON.stringify(["atlanta", "atlanta"]));
    dev.set(LS_RESEARCH_STATIONS, JSON.stringify(["atlanta"]));
    dev.set(LS_PLAYER_DECK, JSON.stringify(deck));
    dev.set(LS_INFECT_DECK, JSON.stringify(infectDeck));
    dev.set(LS_INFECT_DISCARD, JSON.stringify(infectedCities));
    dev.set(LS_CITY_INFECTION, JSON.stringify(cityInfection));
    dev.set(LS_EPIDEMIC_COUNT, "0");
    dev.set(LS_TURN, JSON.stringify({
      currentPlayerIndex: 0, actionsRemaining: 4, phase: "actions",
      pendingCharter: false, pendingShuttle: false, drawCount: 0, infectCount: 0,
    }));

    setScenario("calibrate-jan");
    setPlayerCount(2);
    setFundingCards(FUND_CARD_IDS);
    setSetup({
      playerOrder: [
        { color: "#e8479a", roleId: "dispatcher" },
        { color: "#e8720a", roleId: "medic" },
      ],
      fundingCards: FUND_CARD_IDS,
      characterNames: {},
    });
    setPhase("game");
    setResetKey(k => k + 1);
  };

  const handleRestart = () => {
    setSetup(null); setFundingCards([]);
    setPhase(initialPhase(scenario)); setResetKey(k => k + 1);
  };
  const handleMainMenu = () => {
    setSetup(null); setFundingCards([]);
    setPhase(initialPhase(scenario)); setResetKey(k => k + 1);
  };

  // Single board key — never remounts between deal/roles/game so dealt hands persist
  const boardKey = `board-${scenario}-${resetKey}`;

  return (
    <GameProvider>
      <div style={{ background: "#0b1622", minHeight: "100vh", padding: 12 }}>

        <div style={{
          display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10,
          borderBottom: "1px solid #1e2d3d", paddingBottom: 10,
        }}>
          {SCENARIOS.map(s => (
            <button key={s.id} disabled={!s.built}
              onClick={() => s.built && handleScenarioChange(s.id)}
              style={{
                padding: "5px 12px", fontSize: 12, fontFamily: "system-ui, sans-serif",
                fontWeight: scenario === s.id ? 700 : 400,
                background: scenario === s.id ? "#1a3a6a" : s.built ? "#111e2e" : "transparent",
                color: scenario === s.id ? "#7bc4ff" : s.built ? "#8aaac8" : "#334",
                border: scenario === s.id ? "1px solid #3a6aaa" : s.built ? "1px solid #1e2d3d" : "1px solid #1a2030",
                borderRadius: 5, cursor: s.built ? "pointer" : "not-allowed",
                letterSpacing: scenario === s.id ? 1 : 0,
              }}>
              {s.label}
            </button>
          ))}
          {scenario === "calibrate-jan" && (
            <button onClick={handleQuickStartJan} title="Skip straight to January, actions phase, 2 players, 4-card hands — for panic-level testing"
              style={{
                marginLeft: "auto", padding: "5px 12px", fontSize: 12,
                background: "#1a2a12", color: "#9ad06a", border: "1px solid #3a5a2a",
                borderRadius: 5, cursor: "pointer",
              }}>
              Quick Start: Jan (2p)
            </button>
          )}
          {["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].includes(scenario) && (
            <button
              onClick={() => {
                if (!confirm("Reset all campaign save data? This clears cures, infection, hand cards, research stations, COdA, mutations and all other legacy state for ALL campaign months.")) return;
                setActiveStorage(makeStorage("campaign"));
                clearAllSave();
                handleScenarioChange(scenario);
              }}
              style={{
                marginLeft: "auto", padding: "5px 12px", fontSize: 12,
                background: "#2a1010", color: "#e07070", border: "1px solid #5a2a2a",
                borderRadius: 5, cursor: "pointer",
              }}>
              Reset Campaign Save
            </button>
          )}
          <button onClick={() => setShowCharCal(true)} style={{
            padding: "5px 12px", fontSize: 12,
            background: "#111e2e", color: "#7aafdd", border: "1px solid #1e3555",
            borderRadius: 5, cursor: "pointer",
          }}>
            Character Cards
          </button>
          <button onClick={() => setShowDev(v => !v)} style={{
            padding: "5px 12px", fontSize: 12,
            background: "#111e2e", color: "#556", border: "1px solid #1e2d3d",
            borderRadius: 5, cursor: "pointer",
          }}>
            {showDev ? "Hide Dev" : "Dev Panel"}
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <Board
            key={boardKey}
            setup={phase === "game" ? (setup ?? undefined) : undefined}
            fundingCards={phase !== "infection" ? fundingCards : undefined}
            scenario={scenario}
            onInfectionDone={phase === "infection" ? handleInfectionDone : undefined}
            onChooseRoles={phase === "deal" ? handleChooseRoles : undefined}
            onResumeRoles={phase === "roles-hidden" ? handleResumeRoles : undefined}
            onRestart={handleRestart}
            onMainMenu={handleMainMenu}
            onDoneCalibrating={() => setPhase("game")}
          />
          {phase === "fund" && (
            <FundPhase onConfirm={handleFundConfirm} onViewBoard={() => setPhase("fund-view")} />
          )}
          {phase === "fund-view" && (
            <div
              onClick={() => setPhase("fund")}
              style={{
                position: "absolute", inset: 0, zIndex: 500,
                cursor: "pointer",
                display: "flex", alignItems: "flex-start", justifyContent: "center",
                paddingTop: 12,
              }}
            >
              <div style={{
                background: "rgba(10,20,40,0.82)", border: "1px solid #3a6aaa",
                borderRadius: 8, padding: "8px 20px", color: "#7bc4ff",
                fontSize: 13, fontFamily: "system-ui, sans-serif", pointerEvents: "none",
                userSelect: "none",
              }}>
                Click anywhere to return to Event Cards
              </div>
            </div>
          )}
          {phase === "roles" && (
            <PreGamePhase playerCount={playerCount} onBegin={handleSetup} onViewBoard={handleViewBoard} fundingCards={fundingCards} scenario={scenario} />
          )}
        </div>

        {showDev && (
          <div style={{ background: "#fff", marginTop: 12 }}>
            <DevPanel />
          </div>
        )}
      </div>

      {showCharCal && <CharacterCalibrate onClose={() => setShowCharCal(false)} />}
    </GameProvider>
  );
}
