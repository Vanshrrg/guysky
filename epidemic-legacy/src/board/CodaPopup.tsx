import updateSrc         from "../../object/Jan/update.png";

const COLOR_LABELS: Record<string, string> = {
  black: "Black", yellow: "Yellow", red: "Red", blue: "Blue",
};
const COLOR_HEX: Record<string, string> = {
  black: "#aaa", yellow: "#f5e84a", red: "#e84a4a", blue: "#4a90e8",
};

/**
 * Shown when the 2nd epidemic resolves in January.
 * - Auto-named: clicking the dark overlay closes it.
 * - Tie: player must pick a color; clicking the color card closes it.
 */
export function CodaPopup({ codaColor, candidates, onChoose, onClickOverlay }: {
  codaColor: string | null;
  candidates: string[];
  onChoose: (color: string) => void;
  onClickOverlay: () => void;
}) {
  const named = codaColor ?? (candidates.length === 1 ? candidates[0] : null);
  const needsPick = !named && candidates.length > 1;

  return (
    <div
      onClick={needsPick ? undefined : onClickOverlay}
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(2,6,14,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: needsPick ? "default" : "pointer",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#060f1e", border: "2px solid #cc4400",
          borderRadius: 14, padding: "28px 32px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          maxWidth: 480, width: "90vw",
          fontFamily: "system-ui, sans-serif",
          boxShadow: "0 8px 60px #000",
        }}
      >
        {/* Card images */}
        <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          <img src={updateSrc} alt="Update" draggable={false}
            style={{ height: 160, width: "auto", borderRadius: 6, objectFit: "contain" }} />
        </div>

        {/* Title */}
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e87830", textAlign: "center" }}>
          Mutation Event
        </div>

        {/* Body */}
        {named ? (
          <div style={{ fontSize: 13, color: "#c8ddf4", textAlign: "center", lineHeight: 1.6 }}>
            The{" "}
            <span style={{ color: COLOR_HEX[named] ?? "#fff", fontWeight: 700 }}>
              {COLOR_LABELS[named] ?? named}
            </span>{" "}
            disease has been designated{" "}
            <span style={{ color: "#e87830", fontWeight: 700 }}>COdA-403a</span>.
            <br />It now costs <strong>2 actions</strong> to treat 1 cube.
            <br /><span style={{ color: "#556", fontSize: 11 }}>Click anywhere to dismiss</span>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "#c8ddf4", textAlign: "center", lineHeight: 1.6 }}>
              Multiple diseases are tied for most cubes on the board.
              <br />Choose which disease to designate as{" "}
              <span style={{ color: "#e87830", fontWeight: 700 }}>COdA-403a</span>:
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {candidates.map(color => (
                <button
                  key={color}
                  onClick={() => onChoose(color)}
                  style={{
                    padding: "8px 20px", fontSize: 13, fontWeight: 700,
                    background: "#0a1525",
                    border: `2px solid ${COLOR_HEX[color] ?? "#555"}`,
                    color: COLOR_HEX[color] ?? "#ccc",
                    borderRadius: 7, cursor: "pointer",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {COLOR_LABELS[color] ?? color}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#556" }}>
              It now costs <strong style={{ color: "#aaa" }}>2 actions</strong> to treat 1 cube of the designated disease.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
