import { useState } from "react";
import medicSrc      from "../../object/medic.png";
import scientistSrc  from "../../object/scientist.png";
import researcherSrc from "../../object/researcher.png";
import generalistSrc from "../../object/generalist.png";
import dispatcherSrc from "../../object/dispatcher.png";
import u1Src from "../../object/Jan/characterupgrade1.png";
import u2Src from "../../object/Jan/characterupgrade2.png";
import u3Src from "../../object/Jan/characterupgrade3.png";
import u4Src from "../../object/Jan/characterupgrade4.png";
import u5Src from "../../object/Jan/characterupgrade5.png";
import u6Src from "../../object/Jan/characterupgrade6.png";
import { loadCharacterCal, type CharacterUpgradesData, type CharUpgradeSlot } from "./boardStorage";

export const UPGRADE_SRCS: Record<number, string> = {
  1: u1Src, 2: u2Src, 3: u3Src, 4: u4Src, 5: u5Src, 6: u6Src,
};

const UPGRADE_NAMES: Record<number, string> = {
  1: "Grizzled", 2: "Flexible", 3: "Forecaster",
  4: "Archive Access", 5: "Local Connections", 6: "Pilot",
};

const ROLE_SRCS: Record<string, string> = {
  medic: medicSrc, scientist: scientistSrc, researcher: researcherSrc,
  generalist: generalistSrc, dispatcher: dispatcherSrc,
};

const SLOTS_FOR_ROLE: Record<string, CharUpgradeSlot[]> = {
  medic:      ["upgrade1", "upgrade2"],
  scientist:  ["upgrade1", "upgrade2"],
  researcher: ["upgrade1", "upgrade2"],
  dispatcher: ["upgrade1", "upgrade2"],
  generalist: ["upgrade1", "upgrade2", "upgrade3", "upgrade4"],
};

function getUsedStickers(upgrades: CharacterUpgradesData): Set<number> {
  const used = new Set<number>();
  for (const slots of Object.values(upgrades)) {
    for (const idx of Object.values(slots ?? {})) {
      if (idx) used.add(idx);
    }
  }
  return used;
}

export function CharacterUpgradePanel({
  activeRoles,
  upgrades,
  onPlace,
  onDone,
}: {
  activeRoles: Array<{ roleId: string }>;
  upgrades: CharacterUpgradesData;
  onPlace: (roleId: string, slot: CharUpgradeSlot, stickerIndex: number) => void;
  onDone: () => void;
}) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverRole, setDragOverRole] = useState<string | null>(null);
  const cal = loadCharacterCal();
  const usedStickers = getUsedStickers(upgrades);

  const handleDrop = (roleId: string) => {
    if (draggingIdx === null) return;
    const slots = SLOTS_FOR_ROLE[roleId] ?? ["upgrade1", "upgrade2"];
    const roleUpgrades = upgrades[roleId] ?? {};
    const emptySlot = slots.find(s => !roleUpgrades[s]);
    if (!emptySlot) return; // no empty slot
    onPlace(roleId, emptySlot, draggingIdx);
    setDraggingIdx(null);
    setDragOverRole(null);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(4,8,18,0.95)",
      zIndex: 2600, display: "flex", flexDirection: "column",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "12px 20px", borderBottom: "1px solid #1e3555",
        background: "#0d1b2e", flexShrink: 0,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#e4f0ff" }}>
          Character Upgrade
        </div>
        <div style={{ fontSize: 12, color: "#7a9aaa", flex: 1 }}>
          Drag a sticker onto a character card to permanently place it
        </div>
        <button onClick={onDone} style={{
          padding: "5px 16px", fontSize: 12, borderRadius: 6, cursor: "pointer",
          background: "#1a3060", border: "1px solid #3a6aaa", color: "#7bc4ff",
        }}>
          Done (skip)
        </button>
      </div>

      {/* Sticker tray */}
      <div style={{
        display: "flex", gap: 16, padding: "16px 20px", background: "#080f1a",
        borderBottom: "1px solid #1a2a3a", flexShrink: 0, flexWrap: "wrap",
      }}>
        {[1, 2, 3, 4, 5, 6].map(idx => {
          const used = usedStickers.has(idx);
          return (
            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              {used ? (
                <div style={{
                  width: 72, height: 72, borderRadius: 8,
                  background: "#1a1a22", border: "2px dashed #2a3040",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 20, color: "#334", userSelect: "none" }}>✓</span>
                </div>
              ) : (
                <img
                  src={UPGRADE_SRCS[idx]}
                  alt={UPGRADE_NAMES[idx]}
                  draggable
                  onDragStart={() => setDraggingIdx(idx)}
                  onDragEnd={() => { if (dragOverRole === null) setDraggingIdx(null); }}
                  style={{
                    width: 72, height: 72, objectFit: "contain",
                    borderRadius: 8, border: "2px solid #3a5a8a",
                    cursor: "grab", userSelect: "none",
                    opacity: draggingIdx === idx ? 0.5 : 1,
                  }}
                />
              )}
              <span style={{ fontSize: 9, color: used ? "#334" : "#7aafdd", fontWeight: 600, textAlign: "center" }}>
                {UPGRADE_NAMES[idx]}
                {used ? " (placed)" : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Character cards */}
      <div style={{
        flex: 1, overflowY: "auto", padding: 20,
        display: "flex", gap: 20, flexWrap: "wrap", alignContent: "flex-start",
      }}>
        {activeRoles.map(({ roleId }) => {
          const roleSrc = ROLE_SRCS[roleId];
          const slots = SLOTS_FOR_ROLE[roleId] ?? ["upgrade1", "upgrade2"];
          const roleUpgrades = upgrades[roleId] ?? {};
          const allFull = slots.every(s => !!roleUpgrades[s]);
          const isOver = dragOverRole === roleId;

          return (
            <div key={roleId} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#7aafdd", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {roleId}
              </div>
              <div
                onDragOver={e => {
                  if (draggingIdx !== null && !allFull) {
                    e.preventDefault();
                    setDragOverRole(roleId);
                  }
                }}
                onDragLeave={() => setDragOverRole(null)}
                onDrop={() => handleDrop(roleId)}
                style={{
                  position: "relative",
                  width: 240,
                  outline: isOver ? "3px solid #9a44ff" : allFull ? "2px solid #2a3040" : "2px solid transparent",
                  borderRadius: 6,
                  boxShadow: isOver ? "0 0 20px #9a44ff66" : "none",
                  transition: "outline 0.1s, box-shadow 0.1s",
                  cursor: allFull ? "not-allowed" : draggingIdx !== null ? "copy" : "default",
                }}
              >
                <img
                  src={roleSrc}
                  draggable={false}
                  style={{ width: "100%", height: "auto", display: "block", userSelect: "none", borderRadius: 4 }}
                />

                {/* Upgrade slot overlays */}
                {slots.map(slot => {
                  const placedIdx = roleUpgrades[slot];
                  const uc = cal[slot];
                  if (!uc) return null;
                  return (
                    <div key={slot} style={{
                      position: "absolute",
                      top: `${uc.top}%`, left: `${uc.left}%`,
                      width: `${uc.w}%`, height: `${uc.h}%`,
                      border: placedIdx ? "none" : "2px dashed #9a44ff88",
                      borderRadius: 4,
                      boxSizing: "border-box",
                      pointerEvents: "none",
                    }}>
                      {placedIdx && (
                        <img
                          src={UPGRADE_SRCS[placedIdx]}
                          draggable={false}
                          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                        />
                      )}
                    </div>
                  );
                })}

                {allFull && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 4, fontSize: 12, color: "#7a9aaa",
                  }}>
                    All slots filled
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
