import React, { useEffect, memo } from "react";
import { CITIES } from "./cities";
import { COLOR_TO_CURE_IDX } from "./boardMarkers";
import type { HandCards, TurnStateData } from "./boardStorage";
import type { PreGameSetup } from "./PreGamePhase";

// Kept local (mirrors Board.tsx) to avoid a circular import.
const DISEASE_COLORS = ["black", "yellow", "red", "blue"] as const;
type DiseaseColor = typeof DISEASE_COLORS[number];
type CityColorCounts = Partial<Record<DiseaseColor, number>>;
type CityInfectionMap = Record<string, CityColorCounts>;
const INFECTION_RATE_VALUES = [2, 2, 2, 3, 3, 4, 4];

type EventMode = null | "remote-treatment" | "govt-grant" | "resilient-pop" | "airlift" | "flexible-aid" | "grassroots";

const ROLE_NAMES: Record<string, string> = {
  medic: "Medic", scientist: "Scientist", researcher: "Researcher",
  generalist: "Generalist", dispatcher: "Dispatcher",
};

/**
 * The status / action bar shown during the game phase. Renders the active
 * player, remaining-action pips, a phase-specific instruction line, and the
 * contextual confirm / cancel / advance buttons. The button handlers (cure
 * confirm, Flexible Aid single-write, event cancel-restore) live here and
 * drive the parent's state through the threaded setters.
 */
export const TurnPanel = memo(function TurnPanel({
  setup, turnState, playerColors, currentPlayerKey, infectionPos,
  cureSelecting, selectedHandCards, cured, roleId, quietNight,
  eventMode, handCards, cureThreshold, mutationLevels, cubeSnapshotRef,
  currentPlayerHand, saveHandCards, setPlayerDiscard, setCured, setCureSelecting,
  setSelectedHandCards, saveTurnState, consumeAction, advanceTurn, setQuietNight,
  saveCityInfection, setEventMode, setHighlightCities, setAirliftPawn,
  setFlexibleAidSelected, setEventModeRemaining, setPendingEventCard, setShowDiscardPopup,
  log,
}: {
  setup: PreGameSetup;
  turnState: TurnStateData;
  playerColors: Record<string, string>;
  currentPlayerKey: string;
  infectionPos: number;
  cureSelecting: boolean;
  selectedHandCards: string[];
  cured: boolean[];
  roleId: string | null;
  quietNight: boolean;
  eventMode: EventMode;
  handCards: HandCards;
  cureThreshold: number;
  mutationLevels: Record<string, number>;
  cubeSnapshotRef: React.MutableRefObject<CityInfectionMap | null>;
  currentPlayerHand: string[];
  saveHandCards: (next: HandCards) => void;
  setPlayerDiscard: React.Dispatch<React.SetStateAction<string[]>>;
  setCured: React.Dispatch<React.SetStateAction<boolean[]>>;
  setCureSelecting: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedHandCards: React.Dispatch<React.SetStateAction<string[]>>;
  saveTurnState: (next: TurnStateData) => void;
  consumeAction: (ts: TurnStateData) => TurnStateData;
  advanceTurn: () => void;
  setQuietNight: React.Dispatch<React.SetStateAction<boolean>>;
  saveCityInfection: (next: CityInfectionMap) => void;
  setEventMode: React.Dispatch<React.SetStateAction<EventMode>>;
  setHighlightCities: React.Dispatch<React.SetStateAction<string[]>>;
  setAirliftPawn: React.Dispatch<React.SetStateAction<string | null>>;
  setFlexibleAidSelected: React.Dispatch<React.SetStateAction<string[]>>;
  setEventModeRemaining: React.Dispatch<React.SetStateAction<number>>;
  setPendingEventCard: React.Dispatch<React.SetStateAction<{ player: string; idx: number; cardId: string } | null>>;
  setShowDiscardPopup: React.Dispatch<React.SetStateAction<boolean>>;
  log?: (msg: string) => void;
}) {
  const thresholdFor = (col: DiseaseColor) => cureThreshold - ((mutationLevels[col] ?? 0) >= 3 ? 1 : 0);
  const player = setup.playerOrder[turnState.currentPlayerIndex];
  const playerName = (player?.roleId ? ROLE_NAMES[player.roleId] : null) ?? `Player ${turnState.currentPlayerIndex + 1}`;
  const pColor = playerColors[currentPlayerKey] ?? "#fff";
  const infectTarget = INFECTION_RATE_VALUES[infectionPos] ?? 2;
  const infectionDone = turnState.infectCount >= infectTarget;

  let instruction = "";
  if (turnState.phase === "actions") {
    if (turnState.pendingCharter) instruction = "Charter Flight — click any city";
    else if (turnState.pendingShuttle) instruction = "Shuttle Flight — drag your pawn to another research station";
    else if (cureSelecting) {
      const canConfirm = (() => {
        for (const col of DISEASE_COLORS) {
          const ci = COLOR_TO_CURE_IDX[col];
          if (ci === undefined || cured[ci]) continue;
          const sel = selectedHandCards.filter(id => CITIES.find(c => c.id === id)?.color === col);
          if (sel.length >= thresholdFor(col)) return col;
        }
        return null;
      })();
      instruction = canConfirm
        ? `Select ${thresholdFor(canConfirm)} ${canConfirm} cards then confirm (${selectedHandCards.length} selected)`
        : `Select cards of the same color (${selectedHandCards.length} selected)`;
    }
    else if (roleId === 'dispatcher') instruction = "Drag any pawn to a neighbor, or drag to a teammate's city to transport";
    else instruction = "Drag your pawn or use a card action";
  } else if (turnState.phase === "draw") {
    instruction = `Draw 2 player cards (${turnState.drawCount}/2) — flip then drag to hand`;
  } else if (turnState.phase === "discard") {
    instruction = "Hand limit — drag excess cards to discard (keep 7)";
  } else if (turnState.phase === "discard-action") {
    const who = turnState.discardPlayer ? setup.playerOrder[(['p1','p2','p3','p4'] as const).indexOf(turnState.discardPlayer as 'p1'|'p2'|'p3'|'p4')]?.roleId : null;
    const name = who ? (ROLE_NAMES[who] ?? who) : "Teammate";
    instruction = `${name} over hand limit — drag excess card to discard (keep 7)`;
  } else if (turnState.phase === "infect") {
    instruction = infectionDone ? "All cities infected" : `Infect ${infectTarget} ${infectTarget === 1 ? "city" : "cities"} (${turnState.infectCount}/${infectTarget})`;
  }
  const canConfirmCure = (() => {
    if (!cureSelecting) return null;
    for (const col of DISEASE_COLORS) {
      const ci = COLOR_TO_CURE_IDX[col];
      if (ci === undefined || cured[ci]) continue;
      const sel = selectedHandCards.filter(id => CITIES.find(c => c.id === id)?.color === col);
      if (sel.length >= thresholdFor(col)) return col as DiseaseColor;
    }
    return null;
  })();

  // Auto-complete cure when enough cards are selected
  useEffect(() => {
    if (!canConfirmCure) return;
    const thresh = thresholdFor(canConfirmCure);
    const sel = selectedHandCards.filter(id => CITIES.find(c => c.id === id)?.color === canConfirmCure).slice(0, thresh);
    const hand = currentPlayerHand;
    const newHand = hand.filter(id => !sel.includes(id));
    saveHandCards({ ...handCards, [currentPlayerKey]: newHand });
    setPlayerDiscard(prev => [...prev, ...sel]);
    const ci = COLOR_TO_CURE_IDX[canConfirmCure]!;
    setCured(prev => { const n = [...prev]; n[ci] = true; return n; });
    setCureSelecting(false);
    setSelectedHandCards([]);
    // Tier 2 "Efficient to Sequence": discovering this cure costs no action
    const freeAction = (mutationLevels[canConfirmCure] ?? 0) >= 2;
    const nextTs = freeAction ? turnState : consumeAction(turnState);
    log?.(`${playerName}: discovered the cure for ${canConfirmCure} (discarded ${sel.length} cards${freeAction ? ", free action" : `, ${nextTs.actionsRemaining} actions left`})`);
    saveTurnState(nextTs);
  }, [canConfirmCure]);

  return (
    <div style={{
      marginBottom: 6, padding: "8px 14px",
      background: "#0a1520", border: `1px solid ${pColor}55`,
      borderRadius: 6, fontFamily: "system-ui, sans-serif", fontSize: 12,
      display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: pColor, flexShrink: 0 }} />
        <span style={{ color: pColor, fontWeight: 700 }}>{playerName}</span>
      </div>
      {turnState.phase === "actions" && (
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: Math.max(roleId === 'generalist' ? 5 : 4, turnState.actionsRemaining) }, (_, pi) => (
            <div key={pi} style={{
              width: 10, height: 10, borderRadius: "50%",
              background: pi < turnState.actionsRemaining ? pColor : "#334",
              border: `1px solid ${pColor}88`,
            }} />
          ))}
        </div>
      )}
      <span style={{ color: "#8ab", flex: 1 }}>{instruction}</span>
      {quietNight && (
        <span style={{
          padding: "2px 8px", fontSize: 11, borderRadius: 4,
          background: "#1a2a3a", border: "1px solid #4a7aaa", color: "#88aadd",
          whiteSpace: "nowrap",
        }}>
          🌙 One Quiet Night active
        </span>
      )}
      {cureSelecting && (
        <button onClick={() => { setCureSelecting(false); setSelectedHandCards([]); }}
          style={{ padding: "3px 8px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#2a1a1a", border: "1px solid #884444", color: "#cc8888" }}>
          Cancel
        </button>
      )}
      {turnState.phase === "actions" && !cureSelecting && (
        <button onClick={() => saveTurnState({ ...turnState, actionsRemaining: 0, phase: "draw", drawCount: 0 })}
          style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#111e2e", border: "1px solid #336", color: "#778" }}>
          Skip Turn
        </button>
      )}
      {turnState.phase === "discard" && currentPlayerHand.length <= 7 && (
        <button onClick={() => saveTurnState({ ...turnState, phase: "infect", infectCount: 0 })}
          style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#1a3a1a", border: "1px solid #4a9a4a", color: "#88dd88" }}>
          Continue →
        </button>
      )}
      {turnState.phase === "infect" && infectionDone && !quietNight && (
        <button onClick={advanceTurn}
          style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#1a2a1a", border: "1px solid #4a7a4a", color: "#88cc88" }}>
          End Infection →
        </button>
      )}
      {turnState.phase === "infect" && quietNight && (
        <button onClick={() => { setQuietNight(false); advanceTurn(); }}
          style={{ padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#1a2a3a", border: "1px solid #4a7aaa", color: "#88aadd" }}>
          Skip Infect Cities →
        </button>
      )}
      {(eventMode === 'remote-treatment' || eventMode === 'govt-grant' || eventMode === 'airlift' || eventMode === 'flexible-aid' || eventMode === 'resilient-pop') && (
        <button onClick={() => {
          // Restore any cubes already removed by an in-progress Remote Treatment.
          if (eventMode === 'remote-treatment' && cubeSnapshotRef.current) saveCityInfection(cubeSnapshotRef.current);
          cubeSnapshotRef.current = null;
          setEventMode(null); setHighlightCities([]); setAirliftPawn(null);
          setFlexibleAidSelected([]); setEventModeRemaining(0); setPendingEventCard(null);
          setShowDiscardPopup(false);
        }} style={{ padding: "3px 8px", fontSize: 11, borderRadius: 4, cursor: "pointer", background: "#2a1a1a", border: "1px solid #884444", color: "#cc8888" }}>
          Cancel
        </button>
      )}
    </div>
  );
});
