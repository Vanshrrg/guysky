import { clearGameState } from "./boardStorage";

/** Full-screen win/lose overlay shown when the game ends. */
export function GameOverOverlay({ result, loseReason, onContinue, onRestart, onMainMenu, janWinBonusSrc, janEndgameSrc }: {
  result: "win" | "lose";
  loseReason: string;
  onContinue: () => void;
  onRestart?: () => void;
  onMainMenu?: () => void;
  /** January win bonus image (winbonus.png) — only shown on win */
  janWinBonusSrc?: string;
  /** January endgame upgrade image (end game upgrade.png) — shown on both win and lose */
  janEndgameSrc?: string;
}) {
  const accent = result === "win" ? "#3ddc6d" : "#dc3d3d";
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: result === "win" ? "#00180088" : "#18000088",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: result === "win" ? "#0a2a14" : "#2a0a0a",
        border: `2px solid ${accent}`,
        borderRadius: 14, padding: "36px 52px",
        textAlign: "center", boxShadow: "0 8px 48px #000e",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{result === "win" ? "🏆" : "💀"}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: accent, marginBottom: 8 }}>
          {result === "win" ? "You Win!" : "Game Over"}
        </div>
        {result === "lose" && (
          <div style={{ fontSize: 14, color: "#cc8888", marginBottom: 16 }}>{loseReason}</div>
        )}
        {result === "win" && (
          <div style={{ fontSize: 14, color: "#88cc88", marginBottom: 8 }}>All objectives completed!</div>
        )}
        {/* January endgame images */}
        {janEndgameSrc && (
          <img src={janEndgameSrc} alt="End game upgrade" draggable={false}
            style={{ maxWidth: 220, width: "100%", height: "auto", borderRadius: 6, marginBottom: 8 }} />
        )}
        {result === "win" && janWinBonusSrc && (
          <img src={janWinBonusSrc} alt="Win bonus" draggable={false}
            style={{ maxWidth: 220, width: "100%", height: "auto", borderRadius: 6, marginBottom: 8 }} />
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={onContinue}
            style={{
              padding: "8px 22px", fontSize: 13, background: "transparent",
              border: `1px solid ${accent}`, color: accent, borderRadius: 6, cursor: "pointer",
            }}>
            Continue
          </button>
          {onRestart && (
            <button onClick={() => { clearGameState(); onRestart(); }} style={{
              padding: "8px 22px", fontSize: 13,
              background: "#1a2a1a", border: "1px solid #4a9a4a",
              color: "#88dd88", borderRadius: 6, cursor: "pointer",
            }}>
              Restart
            </button>
          )}
          {onMainMenu && (
            <button onClick={() => { clearGameState(); onMainMenu(); }} style={{
              padding: "8px 22px", fontSize: 13,
              background: "#1a1a2a", border: "1px solid #4a4a8a",
              color: "#8888cc", borderRadius: 6, cursor: "pointer",
            }}>
              Main Menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
