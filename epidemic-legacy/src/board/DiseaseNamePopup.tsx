import { useState } from "react";

const COLOR_LABELS: Record<string, string> = {
  black: "Black", yellow: "Yellow", red: "Red", blue: "Blue",
};
const COLOR_HEX: Record<string, string> = {
  black: "#aaa", yellow: "#f5e84a", red: "#e84a4a", blue: "#4a90e8",
};

/**
 * Shown when a disease is eradicated for the first time.
 * Player can give it a memorable name (or confirm with blank = unnamed).
 */
export function DiseaseNamePopup({ color, currentName, onConfirm }: {
  color: string;
  currentName: string;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState(currentName);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(2,6,14,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#060f1e", border: "2px solid #22aa44",
        borderRadius: 14, padding: "28px 32px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        maxWidth: 380, width: "90vw",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 8px 60px #000",
      }}>
        <div style={{ fontSize: 22 }}>🧬</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#3ddc6d", textAlign: "center" }}>
          Disease Eradicated!
        </div>
        <div style={{ fontSize: 13, color: "#c8ddf4", textAlign: "center", lineHeight: 1.6 }}>
          The{" "}
          <span style={{ color: COLOR_HEX[color] ?? "#fff", fontWeight: 700 }}>
            {COLOR_LABELS[color] ?? color}
          </span>{" "}
          disease has been eradicated.
          <br />Give it a name for the record:
        </div>

        <input
          type="text"
          maxLength={30}
          autoFocus
          placeholder="Disease name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(name.trim()); }}
          style={{
            background: "#0a1525", border: "1px solid #22aa44", borderRadius: 6,
            color: "#c8ddf4", fontSize: 14, padding: "7px 12px", width: "100%",
            boxSizing: "border-box", fontFamily: "system-ui, sans-serif", outline: "none",
          }}
        />

        <button
          onClick={() => onConfirm(name.trim())}
          style={{
            padding: "8px 28px", fontSize: 13, fontWeight: 700,
            background: "linear-gradient(135deg, #1a9940, #22cc55)",
            border: "none", borderRadius: 7, color: "#fff",
            cursor: "pointer", fontFamily: "system-ui, sans-serif",
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
