import { useState } from "react";
import { CITIES } from "./cities";
import { InfectionCard } from "./InfectionCard";

/** Forecast event: drag to reorder the top infection cards; top is drawn first. */
export function ForecastPopup({ cards, onReorder, onConfirm, onCancel }: {
  cards: string[];
  onReorder: (from: number, to: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  return (
    <div onClick={onCancel}
      style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#0c1335", border: "2px solid #334", borderRadius: 10, padding: 20 }}>
        <div style={{ color: "#aac", fontSize: 12, fontFamily: "monospace", marginBottom: 12 }}>
          Forecast — drag to reorder, top card drawn first
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {cards.map((cityId, i) => {
            const city = CITIES.find(c => c.id === cityId);
            if (!city) return null;
            const isDragging = dragIdx === i;
            return (
              <div key={cityId}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx === null || dragIdx === i) return;
                  onReorder(dragIdx, i);
                  setDragIdx(null);
                }}
                onDragEnd={() => setDragIdx(null)}
                style={{
                  opacity: isDragging ? 0.4 : 1,
                  cursor: "grab",
                  outline: isDragging ? "2px dashed #88f" : "none",
                  borderRadius: 6,
                }}>
                <div style={{ color: "#88a", fontSize: 10, fontFamily: "monospace", textAlign: "center", marginBottom: 3 }}>
                  {i === 0 ? "▲ top" : `${i + 1}`}
                </div>
                <InfectionCard city={city} width={120} />
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button onClick={onConfirm}
            style={{ fontSize: 20, background: "#1e3575", border: "2px solid #48f", color: "#cef", borderRadius: 8, padding: "4px 24px", cursor: "pointer" }}>
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}
