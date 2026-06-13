import { CITIES } from "./cities";
import { InfectionCard } from "./InfectionCard";

/**
 * Modal listing the infection discard pile. In `picking` mode (Resilient
 * Population) each card is clickable and calls `onPick` with its real index.
 */
export function InfectionDiscardPopup({ discard, picking, onClose, onPick }: {
  discard: string[];
  picking: boolean;
  onClose: () => void;
  onPick: (realIdx: number) => void;
}) {
  return (
    <div
      onClick={picking ? undefined : onClose}
      style={{
        position: "fixed", inset: 0, background: "#000a",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
          background: "#0c1335", border: `2px solid ${picking ? "#4a9a4a" : "#334"}`,
          borderRadius: 10, padding: 20, maxWidth: "90vw", maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div style={{ color: picking ? "#88dd88" : "#aac", fontSize: 13, marginBottom: 12, fontFamily: "monospace" }}>
          {picking
            ? `Resilient Population — click a card to remove it from the game (${discard.length} in discard)`
            : `Infection Discard — ${discard.length} card${discard.length !== 1 ? "s" : ""}`}
          <button onClick={onClose}
            style={{ float: "right", background: "none", border: "1px solid #556", color: "#aac", cursor: "pointer", borderRadius: 4, padding: "2px 8px" }}>
            ✕
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[...discard].reverse().map((cityId, i) => {
            const city = CITIES.find(c => c.id === cityId);
            if (!city) return null;
            const realIdx = discard.length - 1 - i;
            return (
              <div key={`popup-${i}`}
                onClick={picking ? () => onPick(realIdx) : undefined}
                style={picking ? { cursor: "pointer", borderRadius: 6, outline: "2px solid transparent", transition: "outline-color 0.1s" } : undefined}
                onMouseEnter={picking ? e => { (e.currentTarget as HTMLElement).style.outlineColor = "#4a9a4a"; } : undefined}
                onMouseLeave={picking ? e => { (e.currentTarget as HTMLElement).style.outlineColor = "transparent"; } : undefined}>
                <InfectionCard city={city} width={140} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
