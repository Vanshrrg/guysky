import researchStickerSrc from "../../object/Jan/researchstationsticker.png";
import positiveMutationSrc from "../../object/Jan/positivemutation1.png";

export type UpgradeType = "research-station" | "positive-mutation";

const PLACEHOLDER_LABELS = ["Character Upgrade", "Scarring"];

/**
 * Shown after the win/loss overlay is dismissed. Player picks 2 upgrades
 * total (picksRemaining counts down); only Research Station is implemented
 * so far — the other 3 types render as disabled placeholders.
 */
export function UpgradePopup({ picksRemaining, onPick, mutationAvailable = false }: {
  picksRemaining: number;
  onPick: (type: UpgradeType) => void;
  /** True when at least one disease eradicated this game can still gain a mutation tier. */
  mutationAvailable?: boolean;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2500,
      background: "rgba(2,6,14,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#0a1320", border: "2px solid #3a6aaa",
        borderRadius: 14, padding: "28px 32px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        maxWidth: 520, width: "90vw",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 8px 60px #000",
      }}>
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
            onClick={() => mutationAvailable && onPick("positive-mutation")}
            disabled={!mutationAvailable}
            title={mutationAvailable ? undefined : "Eradicate a disease this game (with tiers still available) to unlock"}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "14px 18px", width: 130,
              background: mutationAvailable ? "#0f1e30" : "#10141c",
              border: `2px solid ${mutationAvailable ? "#3ddc6d" : "#2a3142"}`,
              borderRadius: 10, cursor: mutationAvailable ? "pointer" : "not-allowed",
              color: mutationAvailable ? "#cfe8ff" : "#556", opacity: mutationAvailable ? 1 : 0.6,
              fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600,
            }}>
            <img src={positiveMutationSrc} alt="Positive Mutation" draggable={false}
              style={{ width: 48, height: 48, objectFit: "contain", filter: mutationAvailable ? "none" : "grayscale(1)" }} />
            Positive Mutation
          </button>

          {PLACEHOLDER_LABELS.map(label => (
            <div key={label}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "14px 18px", width: 130,
                background: "#10141c", border: "2px solid #2a3142",
                borderRadius: 10, color: "#556", opacity: 0.6,
                fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600,
              }}>
              <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>?</div>
              {label}
              <div style={{ fontSize: 10, color: "#445" }}>Coming soon</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
