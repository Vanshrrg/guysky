import { loadCharacterNames } from "./boardStorage";

export const MONTH_NAMES: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May",     jun: "June",     jul: "July",   aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
};

const STICKER_ZONES = [
  "RELATIONSHIP 1",
  "RELATIONSHIP 2",
  "UPGRADE 1",
  "UPGRADE 2",
  "SCAR 1",
  "SCAR 2",
];

interface Props {
  roleSrc: string;
  characterName: string;
  dob?: string;           // e.g. "January"
  onNameChange?: (v: string) => void;  // undefined = read-only
  width?: number;
}

export function CharacterCard({ roleSrc, characterName, dob, onNameChange, width = 300 }: Props) {
  const h = Math.round(width * (3.5 / 2.5));
  const halfW = Math.round(width / 2);

  // Name strip height — matches the printed zone at top of physical card (~13%)
  const nameStripH = Math.round(h * 0.13);

  // Right-half zone layout
  const pad = 5;
  const gap = 4;
  const zoneH = Math.round((h - pad * 2 - gap * 5) / 6);
  const zoneW = halfW - pad * 2;

  return (
    <div style={{
      width,
      height: h,
      display: "flex",
      border: "2px solid #4a3010",
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: "0 8px 36px #000d",
      fontFamily: "system-ui, sans-serif",
      flexShrink: 0,
    }}>
      {/* ── Left half: portrait + name overlay ──────────────────────── */}
      <div style={{
        width: halfW,
        height: h,
        position: "relative",
        overflow: "hidden",
        borderRight: "1.5px solid #9a7a40",
        flexShrink: 0,
      }}>
        {/* Role card image — show only left half by making it full-card-width */}
        <img
          src={roleSrc}
          draggable={false}
          style={{
            width: width,
            height: h,
            objectFit: "fill",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />

        {/* Name strip overlay — covers the printed CHARACTER NAME area */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: nameStripH,
          background: "rgba(245, 237, 210, 0.92)",
          borderBottom: "1px solid #9a7a40",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "3px 6px 3px",
          boxSizing: "border-box",
        }}>
          <span style={{
            fontSize: 6.5,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#7a5c28",
            lineHeight: 1,
          }}>
            Character Name
          </span>

          {onNameChange ? (
            <input
              type="text"
              maxLength={20}
              placeholder="Enter name…"
              value={characterName}
              autoFocus
              onChange={e => onNameChange(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1.5px solid #8a6030",
                outline: "none",
                fontSize: 12,
                fontWeight: 700,
                color: "#0a0500",
                fontFamily: "Georgia, 'Times New Roman', serif",
                padding: "0 2px",
                width: "100%",
                boxSizing: "border-box",
                lineHeight: 1.2,
              }}
            />
          ) : (
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#0a0500",
              fontFamily: "Georgia, 'Times New Roman', serif",
              borderBottom: "1px solid #8a6030",
              minHeight: 16,
              padding: "0 2px",
              lineHeight: 1.2,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}>
              {characterName}
            </div>
          )}

          <span style={{
            fontSize: 6.5,
            color: "#8a6e3e",
            letterSpacing: "0.06em",
            lineHeight: 1,
          }}>
            {dob ? `DOB: ${dob}` : "DOB:"}
          </span>
        </div>
      </div>

      {/* ── Right half: sticker zones ────────────────────────────────── */}
      <div style={{
        width: halfW,
        height: h,
        background: "#f5edd8",
        display: "flex",
        flexDirection: "column",
        gap,
        padding: pad,
        boxSizing: "border-box",
        flexShrink: 0,
      }}>
        {STICKER_ZONES.map(label => (
          <div key={label} style={{
            width: zoneW,
            height: zoneH,
            border: "1px solid #c0a870",
            borderRadius: 3,
            background: "#ede0c0",
            display: "flex",
            alignItems: "flex-start",
            padding: "3px 5px",
            boxSizing: "border-box",
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: 7,
              fontWeight: 700,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: "#7a5828",
              userSelect: "none",
              lineHeight: 1,
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Convenience: load the persisted name for a given roleId from localStorage. */
export function getCharacterName(roleId: string): string {
  return loadCharacterNames()[roleId] ?? "";
}
