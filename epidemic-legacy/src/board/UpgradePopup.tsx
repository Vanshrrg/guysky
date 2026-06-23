import researchStickerSrc from "../../object/Jan/researchstationsticker.png";
import positiveMutationSrc from "../../object/Jan/positivemutation1.png";
import unfundUpgradeSrc from "../../object/Jan/unfundupgrade1.png";
import charUpgradeSrc from "../../object/Jan/characterupgrade1.png";

export type UpgradeType = "research-station" | "positive-mutation" | "unfunded-event" | "character-upgrade";

const TOTAL_RS_STICKERS = 8;

export function ResearchStickerPanel({
  placedCount,
  onCancel,
}: {
  placedCount: number;
  onCancel: () => void;
}) {
  const remaining = TOTAL_RS_STICKERS - placedCount;

  return (
    <>
      {/* Floating sticker tray — top-center, always on top */}
      <div style={{
        position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
        zIndex: 2600,
        background: "#0a1320", border: "2px solid #3a9aff",
        borderRadius: 12, padding: "12px 20px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 6px 32px #000c",
        userSelect: "none",
      }}>
        <div style={{ fontSize: 13, color: "#7bc4ff", fontWeight: 700 }}>
          Research Station Stickers — drag one to an eligible city
        </div>
        <div style={{ fontSize: 11, color: "#9ab" }}>
          {remaining} of {TOTAL_RS_STICKERS} remaining
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {Array.from({ length: remaining }).map((_, i) => (
            <img
              key={i}
              src={researchStickerSrc}
              alt="Research Station Sticker"
              draggable
              onDragStart={e => e.dataTransfer.setData("text/plain", "rs-sticker")}
              style={{
                width: 52, height: 52, objectFit: "contain",
                cursor: "grab", borderRadius: 6,
                border: "1.5px solid #3a9aff44",
              }}
            />
          ))}
          {remaining === 0 && (
            <div style={{ color: "#556", fontSize: 12 }}>All stickers placed</div>
          )}
        </div>
        <button
          onClick={onCancel}
          style={{
            marginTop: 2, padding: "4px 16px", background: "transparent",
            border: "1px solid #3a6aaa", borderRadius: 6, color: "#9ab",
            cursor: "pointer", fontSize: 12,
          }}>
          Cancel
        </button>
      </div>

      {/* Drop zones over eligible cities */}
      {/* These are rendered by Board.tsx — we just export the handler types */}
    </>
  );
}

/**
 * Shown after the win/loss overlay is dismissed. Player picks 2 upgrades
 * total (picksRemaining counts down); only Research Station is implemented
 * so far — the other 3 types render as disabled placeholders.
 */
export function UpgradePopup({ picksRemaining, onPick, onClose }: {
  picksRemaining: number;
  onPick: (type: UpgradeType) => void;
  /** When provided, shows a close (✕) button to dismiss the popup without picking. */
  onClose?: () => void;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2500,
      background: "rgba(2,6,14,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        position: "relative",
        background: "#0a1320", border: "2px solid #3a6aaa",
        borderRadius: 14, padding: "28px 32px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        maxWidth: 520, width: "90vw",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 8px 60px #000",
      }}>
        {onClose && (
          <button onClick={onClose} title="Close" style={{
            position: "absolute", top: 10, right: 12,
            background: "transparent", border: "none", color: "#7bc4ff",
            fontSize: 20, lineHeight: 1, cursor: "pointer", padding: 4,
          }}>✕</button>
        )}
        <div style={{ fontSize: 18, fontWeight: 700, color: "#7bc4ff", textAlign: "center" }}>
          Choose an Upgrade
        </div>
        <div style={{ fontSize: 13, color: "#9ab", textAlign: "center" }}>
          {picksRemaining} pick{picksRemaining !== 1 ? "s" : ""} remaining — upgrades are permanent for future games.
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => onPick("research-station")}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "14px 18px", width: 130,
              background: "#0f1e30", border: "2px solid #3a9aff",
              borderRadius: 10, cursor: "pointer", color: "#cfe8ff",
              fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600,
            }}>
            <img src={researchStickerSrc} alt="Research Station" draggable={false}
              style={{ width: 48, height: 48, objectFit: "contain" }} />
            Research Station
          </button>

          <button
            onClick={() => onPick("positive-mutation")}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "14px 18px", width: 130,
              background: "#0f1e30", border: "2px solid #3ddc6d",
              borderRadius: 10, cursor: "pointer", color: "#cfe8ff",
              fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600,
            }}>
            <img src={positiveMutationSrc} alt="Positive Mutation" draggable={false}
              style={{ width: 48, height: 48, objectFit: "contain" }} />
            Positive Mutation
          </button>

          <button
            onClick={() => onPick("unfunded-event")}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "14px 18px", width: 130,
              background: "#0f1e30", border: "2px solid #c07a30",
              borderRadius: 10, cursor: "pointer", color: "#cfe8ff",
              fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600,
            }}>
            <img src={unfundUpgradeSrc} alt="Unfunded Event" draggable={false}
              style={{ width: 48, height: 48, objectFit: "contain" }} />
            Unfunded Event
          </button>

          <button
            onClick={() => onPick("character-upgrade")}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "14px 18px", width: 130,
              background: "#0f1e30", border: "2px solid #9a44ff",
              borderRadius: 10, cursor: "pointer", color: "#cfe8ff",
              fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600,
            }}>
            <img src={charUpgradeSrc} alt="Character Upgrade" draggable={false}
              style={{ width: 48, height: 48, objectFit: "contain" }} />
            Character Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
