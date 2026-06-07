import { useState } from "react";
import { GameProvider } from "./state/GameContext";
import { DevPanel } from "./dev/DevPanel";
import { Board } from "./board/Board";

export default function App() {
  const [showDev, setShowDev] = useState(false);

  return (
    <GameProvider>
      <div style={{ background: "#0b1622", minHeight: "100vh", padding: 12 }}>
        <button
          onClick={() => setShowDev((v) => !v)}
          style={{ marginBottom: 8 }}
        >
          {showDev ? "Hide" : "Show"} Dev Panel
        </button>
        <Board />
        {showDev && (
          <div style={{ background: "#fff", marginTop: 12 }}>
            <DevPanel />
          </div>
        )}
      </div>
    </GameProvider>
  );
}
