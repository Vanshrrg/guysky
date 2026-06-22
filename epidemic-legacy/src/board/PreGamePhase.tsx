import { useRef, useState, useEffect } from "react";
import { LS_CHARACTER_NAMES, loadCharacterNames } from "./boardStorage";
import medicSrc from "../../object/medic.png";
import scientistSrc from "../../object/scientist.png";
import researcherSrc from "../../object/researcher.png";
import generalistSrc from "../../object/generalist.png";
import dispatcherSrc from "../../object/dispatcher.png";
import fund1Src from "../../object/onequietnight.png";
import fund2Src from "../../object/remotetreatment.png";
import fund3Src from "../../object/govermentgrant.png";
import fund4Src from "../../object/resilientpopulation.png";
import fund5Src from "../../object/forecast.png";
import fund6Src from "../../object/airlift.png";
import fund7Src from "../../object/borrowedtime.png";
import fund8Src from "../../object/flexibleaid.png";

const FUND_CARDS = [fund1Src, fund2Src, fund3Src, fund4Src, fund5Src, fund6Src, fund7Src, fund8Src];
const TOKEN_COLORS = ["#e8479a", "#e8720a", "#f0f0f0", "#1a2a8a"];

const ALL_ROLES = [
  { id: "medic",      name: "Medic",      src: medicSrc },
  { id: "scientist",  name: "Scientist",  src: scientistSrc },
  { id: "researcher", name: "Researcher", src: researcherSrc },
  { id: "generalist", name: "Generalist", src: generalistSrc },
  { id: "dispatcher", name: "Dispatcher", src: dispatcherSrc },
];

export interface PreGameSetup {
  playerOrder: Array<{ color: string; roleId: string }>;
  fundingCards: string[];
  characterNames: Record<string, string>;
}

const overlayStyle: React.CSSProperties = {
  position: "absolute", inset: 0,
  background: "rgba(4,8,18,0.86)", zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center",
};
const panelStyle: React.CSSProperties = {
  background: "#0d1b2e", border: "1.5px solid #1e3555", borderRadius: 14,
  padding: "22px 24px 20px", width: "min(880px, 94vw)", maxHeight: "94vh",
  overflowY: "auto", color: "#d0e4f8", fontFamily: "system-ui, sans-serif",
  boxShadow: "0 16px 70px #000d", display: "flex", flexDirection: "column", gap: 14,
};
const confirmBtn: React.CSSProperties = {
  width: 52, height: 52, borderRadius: "50%", border: "none",
  background: "linear-gradient(135deg, #1a9940, #22cc55)",
  color: "#fff", fontSize: 26, fontWeight: 700, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 20px #22cc5566", flexShrink: 0,
};
const viewBoardBtn: React.CSSProperties = {
  padding: "4px 12px", fontSize: 11, borderRadius: 5, cursor: "pointer",
  background: "transparent", border: "1px solid #2a4060", color: "#7aafdd",
};

function PawnSvg({ color, size = 44 }: { color: string; size?: number }) {
  const isLight = color === "#f0f0f0";
  return (
    <svg viewBox="0 0 100 150" width={size} height={size * 1.5}
      style={{ display: "block", filter: "drop-shadow(0 3px 8px #000a)" }}>
      <path d="M 36,50 C 18,68 10,105 12,132 Q 12,148 50,148 Q 88,148 88,132 C 90,105 82,68 64,50 Z"
        fill={color} stroke={isLight ? "#999" : "none"} strokeWidth={isLight ? 2 : 0} />
      <ellipse cx="50" cy="50" rx="15" ry="8" fill={color} />
      <circle cx="50" cy="28" r="24" fill={color}
        stroke={isLight ? "#999" : "none"} strokeWidth={isLight ? 2 : 0} />
      <circle cx="40" cy="20" r="7" fill="rgba(255,255,255,0.30)" />
    </svg>
  );
}

// ─── FundPhase: choose event cards only ──────────────────────────────────────
interface FundProps {
  onConfirm: (fundingCards: string[]) => void;
  onViewBoard?: () => void;
}
export function FundPhase({ onConfirm, onViewBoard }: FundProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggle = (idx: number) => setSelected(prev => {
    const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n;
  });

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#e4f0ff" }}>Event Cards</div>
            {onViewBoard && <button onClick={onViewBoard} style={viewBoardBtn}>View Board</button>}
          </div>
          <button onClick={() => onConfirm(Array.from(selected).map(i => `fund${i + 1}`))}
            style={confirmBtn}>✓</button>
        </div>

        {[0, 4].map(rowStart => (
          <div key={rowStart} style={{ display: "flex", gap: 14 }}>
            {FUND_CARDS.slice(rowStart, rowStart + 4).map((src, i) => {
              const idx = rowStart + i;
              const sel = selected.has(idx);
              return (
                <div key={idx} onClick={() => toggle(idx)} style={{
                  flex: 1, aspectRatio: "2.5/3.5", overflow: "hidden",
                  position: "relative", cursor: "pointer",
                  outline: sel ? "3px solid #ffcc44" : "3px solid transparent",
                  borderRadius: 4, boxShadow: sel ? "0 0 18px #ffcc4477" : "none",
                  transition: "outline-color 0.12s, box-shadow 0.12s",
                }}>
                  <img src={src} draggable={false} style={{
                    position: "absolute", bottom: 0, left: 0,
                    width: "100%", height: "100%", objectFit: "cover",
                    objectPosition: "bottom", display: "block",
                    userSelect: "none", pointerEvents: "none",
                  }} />
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ color: "#556", fontSize: 11, textAlign: "center" }}>
          {selected.size > 0
            ? `${selected.size} event card${selected.size > 1 ? "s" : ""} selected — will be shuffled into the deck`
            : "No event cards selected — click ✓ to proceed with city cards only"}
        </div>
      </div>
    </div>
  );
}

// ─── PreGamePhase: choose roles ───────────────────────────────────────────────
interface RolesProps {
  playerCount: number;
  onBegin: (setup: PreGameSetup) => void;
  onViewBoard?: () => void;
  fundingCards: string[];
  scenario?: string;
}
export function PreGamePhase({ playerCount, onBegin, onViewBoard, fundingCards, scenario }: RolesProps) {
  const isJan = scenario === 'jan';
  const [placements, setPlacements] = useState<Array<{ roleId: string; color: string }>>([]);
  const [dragging, setDragging] = useState<{ color: string; x: number; y: number } | null>(null);
  const roleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Character names — only for January; persisted across restarts
  const [characterNames, setCharacterNames] = useState<Record<string, string>>(loadCharacterNames);
  // Snapshot of names that existed before this session — used to decide read-only.
  // Names typed THIS session stay editable; only prior-campaign names are locked.
  const [priorNames] = useState<Record<string, string>>(loadCharacterNames);
  useEffect(() => {
    localStorage.setItem(LS_CHARACTER_NAMES, JSON.stringify(characterNames));
  }, [characterNames, isJan]);

  // Only offer TOKEN_COLORS[0..playerCount-1] — matches the dealt hands
  const validColors = TOKEN_COLORS.slice(0, Math.max(2, playerCount));
  const slotMap = Object.fromEntries(placements.map(p => [p.roleId, p.color]));
  const placedColors = new Set(placements.map(p => p.color));
  const trayColors = validColors.filter(c => !placedColors.has(c));

  function startDrag(color: string, fromRole: string | null, e: React.PointerEvent) {
    e.preventDefault(); e.stopPropagation();
    if (fromRole) setPlacements(prev => prev.filter(p => p.roleId !== fromRole));
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    setDragging({ color, x: e.clientX, y: e.clientY });
    const onMove = (ev: PointerEvent) => setDragging(d => d ? { ...d, x: ev.clientX, y: ev.clientY } : null);
    const onUp = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", onMove as EventListener);
      el.removeEventListener("pointerup", onUp);
      for (const [roleId, ref] of Object.entries(roleRefs.current)) {
        if (!ref) continue;
        const rect = ref.getBoundingClientRect();
        if (ev.clientX >= rect.left && ev.clientX <= rect.right &&
            ev.clientY >= rect.top  && ev.clientY <= rect.bottom) {
          setPlacements(prev => [...prev.filter(p => p.roleId !== roleId), { roleId, color }]);
          break;
        }
      }
      setDragging(null);
    };
    el.addEventListener("pointermove", onMove as EventListener);
    el.addEventListener("pointerup", onUp);
  }

  function renderRole(role: typeof ALL_ROLES[0]) {
    const tokenColor = slotMap[role.id] ?? null;
    const placed = placements.some(p => p.roleId === role.id);
    const existingName = characterNames[role.id] ?? '';
    const isReadOnly = (priorNames[role.id] ?? '').length > 0; // locked only if named in a prior campaign month

    return (
      <div key={role.id} ref={el => { roleRefs.current[role.id] = el; }}
        style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ position: "relative", containerType: "inline-size" }}>
          <img src={role.src} alt={role.name} draggable={false}
            style={{ width: "100%", height: "auto", display: "block", userSelect: "none", pointerEvents: "none" }} />
          {tokenColor && (
            <div onPointerDown={e => startDrag(tokenColor, role.id, e)}
              style={{ position: "absolute", top: 8, right: 8, cursor: "grab", touchAction: "none", userSelect: "none", zIndex: 10 }}>
              <PawnSvg color={tokenColor} size={36} />
            </div>
          )}
          {/* Name — sits directly on the printed CHARACTER NAME area of the card image */}
          {(placed || existingName.length > 0) && (
            isReadOnly ? (
              <div style={{
                position: "absolute",
                top: "calc(6.5% - 4px)", left: "5%", width: "34%",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 700, fontSize: "2.8cqw", color: "#0a0500",
                lineHeight: 1.2, pointerEvents: "none", userSelect: "none",
                overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                zIndex: 5,
              }}>
                {existingName}
              </div>
            ) : (
              <input
                type="text"
                maxLength={20}
                placeholder="Type name…"
                autoFocus
                value={characterNames[role.id] ?? ''}
                onChange={e => setCharacterNames(prev => ({ ...prev, [role.id]: e.target.value }))}
                style={{
                  position: "absolute",
                  top: "calc(6.5% - 4px)", left: "5%", width: "34%",
                  background: "transparent", border: "none", outline: "none",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontWeight: 700, fontSize: "2.8cqw", color: "#0a0500",
                  lineHeight: 1.2, padding: 0, zIndex: 5,
                  caretColor: "#0a0500", overflow: "hidden",
                }}
              />
            )
          )}
        </div>
      </div>
    );
  }

  const allNamed = placements.every(p => (characterNames[p.roleId] ?? '').trim().length > 0);

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#e4f0ff" }}>Choose Roles</div>
            {onViewBoard && <button onClick={onViewBoard} style={viewBoardBtn}>View Board</button>}
          </div>
          {placements.length >= validColors.length && allNamed ? (
            <button onClick={() => onBegin({ playerOrder: placements, fundingCards, characterNames })}
              style={confirmBtn}>✓</button>
          ) : (
            <span style={{ fontSize: 11, color: placements.length >= validColors.length ? "#996622" : "#556", fontFamily: "monospace" }}>
              {placements.length < validColors.length
                ? `${placements.length}/${validColors.length} roles assigned`
                : "Name all characters to continue"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 14 }}>{ALL_ROLES.slice(0, 2).map(renderRole)}</div>
        <div style={{ display: "flex", gap: 14 }}>{ALL_ROLES.slice(2).map(renderRole)}</div>

        <div style={{
          display: "flex", gap: 18, justifyContent: "center", alignItems: "center",
          padding: "10px 0 4px", minHeight: 72, borderTop: "1px solid #1a2f4a",
        }}>
          {trayColors.map(color => (
            <div key={color} onPointerDown={e => startDrag(color, null, e)}
              style={{ cursor: "grab", touchAction: "none", userSelect: "none" }}>
              <PawnSvg color={color} size={44} />
            </div>
          ))}
        </div>
      </div>

      {dragging && (
        <div style={{
          position: "fixed", left: dragging.x, top: dragging.y,
          transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 9999,
        }}>
          <PawnSvg color={dragging.color} size={52} />
        </div>
      )}
    </div>
  );
}
