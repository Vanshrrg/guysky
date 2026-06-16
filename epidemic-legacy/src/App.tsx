import { useState } from "react";
import { GameProvider } from "./state/GameContext";
import { DevPanel } from "./dev/DevPanel";
import { Board } from "./board/Board";
import { FundPhase, PreGamePhase, type PreGameSetup } from "./board/PreGamePhase";

const SCENARIOS = [
  { id: "board",  label: "Board",   built: true },
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
  return scenarioId === "month0" ? "infection" : "fund";
}

export default function App() {
  const [showDev, setShowDev] = useState(false);
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
          <button onClick={() => setShowDev(v => !v)} style={{
            marginLeft: "auto", padding: "5px 12px", fontSize: 12,
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
    </GameProvider>
  );
}
