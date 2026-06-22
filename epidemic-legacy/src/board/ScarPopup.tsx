// ScarPopup: drag a scar sticker onto the character card, or shows the tear animation.
import { useRef, useState, useEffect } from "react";
import { loadCharacterCal } from "./boardStorage";
import type { ScarEntry, ScarRegion } from "./boardStorage";

import scar1Src from "../../object/Jan/scar1.png";
import scar2Src from "../../object/Jan/scar2.png";
import scar3Src from "../../object/Jan/scar3.png";
import scar4Src from "../../object/Jan/scar4.png";
import scar5Src from "../../object/Jan/scar5.png";
import scar6Src from "../../object/Jan/scar6.png";
import scar7Src from "../../object/Jan/scar7.png";
import scar8Src from "../../object/Jan/scar8.png";
import scar9Src from "../../object/Jan/scar9.png";

export const SCAR_SRCS: Record<string, string> = {
  scar1: scar1Src, scar2: scar2Src, scar3: scar3Src,
  scar4: scar4Src, scar5: scar5Src, scar6: scar6Src,
  scar7: scar7Src, scar8: scar8Src, scar9: scar9Src,
};
export const SCAR_NAMES: Record<string, string> = {
  scar1: "INSOMNIAC", scar2: "PTSD", scar3: "OVERCAUTIOUS",
  scar4: "REGRETFUL", scar5: "GERMOPHOBIC", scar6: "OVERCAUTIOUS",
  scar7: "INTIMIDATED", scar8: "OBSESSED", scar9: "DEMORALIZED",
};

interface Props {
  roleSrc: string;
  placedScars: ScarEntry[];
  scarPool: Record<string, number>;
  region: ScarRegion; // shown in future tooltip; unused for now
  onPlace: (scarId: string) => void;
}

export function ScarPickPopup({ roleSrc, placedScars, scarPool, onPlace }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cal = loadCharacterCal();

  // Which scar is being dragged
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dropped, setDropped] = useState(false);

  const SCAR_POOL_MAX: Record<string, number> = {
    scar1: 2, scar2: 2, scar3: 2,
    scar4: 1, scar5: 1, scar6: 1, scar7: 1, scar8: 1, scar9: 1,
  };

  // Scars still available in pool
  const available = Object.keys(SCAR_POOL_MAX).filter(id => {
    const used = scarPool[id] ?? 0;
    return used < SCAR_POOL_MAX[id];
  });

  const slotKey = placedScars.length === 0 ? "scar1" : "scar2";
  const slotCal = cal[slotKey as "scar1" | "scar2"];

  const startDrag = (e: React.PointerEvent, scarId: string) => {
    e.preventDefault();
    setDragging(scarId);
    setDragPos({ x: e.clientX, y: e.clientY });
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => setDragPos({ x: ev.clientX, y: ev.clientY });
    const onUp = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      // Check if dropped on the card
      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right &&
            ev.clientY >= r.top && ev.clientY <= r.bottom) {
          setDropped(true);
          setTimeout(() => onPlace(scarId), 400);
        } else {
          setDragging(null);
        }
      }
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(4,8,18,0.92)",
      zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ color: "#f44", fontSize: 20, fontWeight: 700 }}>⚠ CHARACTER SCARRED</div>
      <div style={{ color: "#aac", fontSize: 13 }}>Drag a scar sticker onto the character card</div>

      {/* Card + drop zone */}
      <div ref={cardRef} style={{ position: "relative", width: 240 }}>
        <img src={roleSrc} draggable={false}
          style={{ width: "100%", height: "auto", display: "block", borderRadius: 8, boxShadow: "0 8px 36px #000e" }} />
        {/* Already placed scars */}
        {placedScars.map((s, i) => {
          const slot = i === 0 ? cal.scar1 : cal.scar2;
          return (
            <img key={s.id} src={SCAR_SRCS[s.id]} draggable={false} style={{
              position: "absolute",
              top: `${slot.top}%`, left: `${slot.left}%`,
              width: `${slot.w}%`,
              pointerEvents: "none",
            }} />
          );
        })}
        {/* Drop zone highlight */}
        {dragging && !dropped && (
          <div style={{
            position: "absolute",
            top: `${slotCal.top}%`, left: `${slotCal.left}%`,
            width: `${slotCal.w}%`, height: `${slotCal.h}%`,
            border: "2px dashed #f44", borderRadius: 3,
            background: "#f4420022", pointerEvents: "none",
          }} />
        )}
        {/* Snapped ghost on drop */}
        {dropped && dragging && (
          <img src={SCAR_SRCS[dragging]} draggable={false} style={{
            position: "absolute",
            top: `${slotCal.top}%`, left: `${slotCal.left}%`,
            width: `${slotCal.w}%`,
            pointerEvents: "none",
            transition: "opacity 0.3s",
          }} />
        )}
      </div>

      {/* Sticker tray */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 500 }}>
        {available.map(id => {
          const count = SCAR_POOL_MAX[id] - (scarPool[id] ?? 0);
          const isDragging = dragging === id;
          return (
            <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                onPointerDown={e => startDrag(e, id)}
                style={{
                  cursor: isDragging ? "grabbing" : "grab",
                  opacity: isDragging ? 0.3 : 1,
                  userSelect: "none", touchAction: "none",
                  background: "#0d1b2e", borderRadius: 6,
                  border: "1px solid #2a4060", padding: 4,
                  width: 120,
                }}
              >
                <img src={SCAR_SRCS[id]} draggable={false}
                  style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }} />
              </div>
              <span style={{ fontSize: 9, color: "#aac", fontWeight: 700 }}>
                {SCAR_NAMES[id]} {count > 1 ? `×${count}` : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Floating drag ghost */}
      {dragging && !dropped && (
        <img src={SCAR_SRCS[dragging]} draggable={false} style={{
          position: "fixed",
          left: dragPos.x - 60,
          top: dragPos.y - 20,
          width: 120,
          pointerEvents: "none",
          zIndex: 4000,
          opacity: 0.9,
          filter: "drop-shadow(0 4px 12px #000)",
        }} />
      )}
    </div>
  );
}

// ── Tear animation overlay ────────────────────────────────────────────────────
interface TearProps {
  roleSrc: string;       // the card being torn
  civilianSrc: string;   // revealed underneath
  onDone: () => void;
}

export function TearOverlay({ roleSrc, civilianSrc, onDone }: TearProps) {
  const [phase, setPhase] = useState<"idle" | "tearing" | "done">("idle");

  useEffect(() => {
    // small delay so the overlay renders before animation starts
    const t1 = setTimeout(() => setPhase("tearing"), 80);
    const t2 = setTimeout(() => { setPhase("done"); onDone(); }, 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const tearing = phase === "tearing";

  const baseCard: React.CSSProperties = {
    position: "absolute", inset: 0,
    backgroundImage: `url(${roleSrc})`,
    backgroundSize: "100% 100%",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(4,8,18,0.95)",
      zIndex: 3500, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* Card container, 240px wide */}
      <div style={{ position: "relative", width: 240, aspectRatio: "2.5 / 3.5" }}>
        {/* Civilian underneath */}
        <img src={civilianSrc} draggable={false} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", borderRadius: 8,
        }} />
        {/* Left half — clips to roughly 45% width with jagged seam */}
        <div style={{
          ...baseCard,
          clipPath: "polygon(0 0, 53% 0, 42% 100%, 0 100%)",
          transition: "transform 0.55s cubic-bezier(.2,.7,.3,1), opacity 0.4s ease 0.25s",
          transform: tearing ? "translate(-38px, 14px) rotate(-18deg)" : "none",
          opacity: tearing ? 0 : 1,
          borderRadius: 8,
        }} />
        {/* Right half */}
        <div style={{
          ...baseCard,
          clipPath: "polygon(53% 0, 100% 0, 100% 100%, 42% 100%)",
          transition: "transform 0.55s cubic-bezier(.2,.7,.3,1), opacity 0.4s ease 0.25s",
          transform: tearing ? "translate(38px, 14px) rotate(18deg)" : "none",
          opacity: tearing ? 0 : 1,
          borderRadius: 8,
        }} />
      </div>
      <div style={{
        position: "absolute", bottom: "20%",
        color: "#f44", fontSize: 18, fontWeight: 700,
        opacity: tearing ? 1 : 0, transition: "opacity 0.3s ease 0.3s",
      }}>
        CHARACTER LOST
      </div>
    </div>
  );
}
