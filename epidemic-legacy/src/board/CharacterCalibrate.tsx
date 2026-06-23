import { useState, useRef, useCallback } from "react";
import medicSrc      from "../../object/medic.png";
import scientistSrc  from "../../object/scientist.png";
import researcherSrc from "../../object/researcher.png";
import generalistSrc from "../../object/generalist.png";
import dispatcherSrc from "../../object/dispatcher.png";
import rel1Src       from "../../object/Feb/relationship1.png";
import rel2Src       from "../../object/Feb/relationship2.png";
import upgrade1Src   from "../../object/Jan/characterupgrade1.png";
import upgrade2Src   from "../../object/Jan/characterupgrade2.png";
import scar1Src      from "../../object/Jan/scar1.png";
import scar2Src      from "../../object/Jan/scar2.png";
import {
  LS_CHARACTER_CAL, DEF_CHARACTER_CAL,
  type CharacterCalData, type CharCalItem,
} from "./boardStorage";

const ROLES = [
  { id: "medic",      src: medicSrc,      name: "Medic" },
  { id: "scientist",  src: scientistSrc,  name: "Scientist" },
  { id: "researcher", src: researcherSrc, name: "Researcher" },
  { id: "generalist", src: generalistSrc, name: "Generalist" },
  { id: "dispatcher", src: dispatcherSrc, name: "Dispatcher" },
];

interface ItemDef {
  key: keyof CharacterCalData;
  label: string;
  color: string;
  src?: string;
  freeResize?: boolean; // true = free W+H (textbox); false = ratio-locked corner (sticker)
  generalistOnly?: boolean;
}

const ITEMS: ItemDef[] = [
  { key: "name",          label: "NAME",           color: "#3ddc6d", src: undefined,   freeResize: true  },
  { key: "relationship1", label: "RELATIONSHIP 1", color: "#44aaff", src: rel1Src,     freeResize: false },
  { key: "relationship2", label: "RELATIONSHIP 2", color: "#0077cc", src: rel2Src,     freeResize: false },
  { key: "upgrade1",      label: "UPGRADE 1",      color: "#ffcc44", src: upgrade1Src, freeResize: false },
  { key: "upgrade2",      label: "UPGRADE 2",      color: "#ff8844", src: upgrade2Src, freeResize: false },
  { key: "upgrade3",      label: "UPGRADE 3",      color: "#cc9900", src: upgrade1Src, freeResize: false, generalistOnly: true },
  { key: "upgrade4",      label: "UPGRADE 4",      color: "#aa6600", src: upgrade2Src, freeResize: false, generalistOnly: true },
  { key: "scar1",         label: "SCAR 1",         color: "#ff4466", src: scar1Src,    freeResize: false },
  { key: "scar2",         label: "SCAR 2",         color: "#cc44ff", src: scar2Src,    freeResize: false },
];

// ── Single draggable / resizable overlay item ─────────────────────────────────
function CalOverlayItem({
  item, def, cardRef, onChange,
}: {
  item: CharCalItem;
  def: ItemDef;
  cardRef: React.RefObject<HTMLDivElement | null>;
  onChange: (next: CharCalItem) => void;
}) {
  const startDrag = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const rect = cardRef.current!.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const ol = item.left, ot = item.top;
    const onMove = (ev: PointerEvent) => onChange({
      ...item,
      left: ol + (ev.clientX - sx) / rect.width  * 100,
      top:  ot + (ev.clientY - sy) / rect.height * 100,
    });
    const onUp = () => {
      el.removeEventListener("pointermove", onMove as EventListener);
      el.removeEventListener("pointerup", onUp);
    };
    el.addEventListener("pointermove", onMove as EventListener);
    el.addEventListener("pointerup", onUp);
  }, [item, cardRef, onChange]);

  const startResizeW = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const rect = cardRef.current!.getBoundingClientRect();
    const sx = e.clientX, ow = item.w;
    const onMove = (ev: PointerEvent) => onChange({
      ...item, w: Math.max(2, ow + (ev.clientX - sx) / rect.width * 100),
    });
    const onUp = () => {
      el.removeEventListener("pointermove", onMove as EventListener);
      el.removeEventListener("pointerup", onUp);
    };
    el.addEventListener("pointermove", onMove as EventListener);
    el.addEventListener("pointerup", onUp);
  }, [item, cardRef, onChange]);

  const startResizeH = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const rect = cardRef.current!.getBoundingClientRect();
    const sy = e.clientY, oh = item.h;
    const onMove = (ev: PointerEvent) => onChange({
      ...item, h: Math.max(2, oh + (ev.clientY - sy) / rect.height * 100),
    });
    const onUp = () => {
      el.removeEventListener("pointermove", onMove as EventListener);
      el.removeEventListener("pointerup", onUp);
    };
    el.addEventListener("pointermove", onMove as EventListener);
    el.addEventListener("pointerup", onUp);
  }, [item, cardRef, onChange]);

  // Free corner resize (textbox — W and H independently)
  const startResizeFree = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const rect = cardRef.current!.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, ow = item.w, oh = item.h;
    const onMove = (ev: PointerEvent) => onChange({
      ...item,
      w: Math.max(2, ow + (ev.clientX - sx) / rect.width  * 100),
      h: Math.max(2, oh + (ev.clientY - sy) / rect.height * 100),
    });
    const onUp = () => {
      el.removeEventListener("pointermove", onMove as EventListener);
      el.removeEventListener("pointerup", onUp);
    };
    el.addEventListener("pointermove", onMove as EventListener);
    el.addEventListener("pointerup", onUp);
  }, [item, cardRef, onChange]);

  // Ratio-locked corner resize (stickers — drag by whichever axis moved more)
  const startResizeRatio = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const rect = cardRef.current!.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, ow = item.w, oh = item.h;
    const ratio = oh / ow; // locked aspect ratio
    const onMove = (ev: PointerEvent) => {
      const dw = (ev.clientX - sx) / rect.width  * 100;
      const dh = (ev.clientY - sy) / rect.height * 100;
      // Use whichever delta is larger in magnitude
      const newW = Math.max(2, ow + (Math.abs(dw) >= Math.abs(dh) ? dw : dh / ratio));
      onChange({ ...item, w: newW, h: newW * ratio });
    };
    const onUp = () => {
      el.removeEventListener("pointermove", onMove as EventListener);
      el.removeEventListener("pointerup", onUp);
    };
    el.addEventListener("pointermove", onMove as EventListener);
    el.addEventListener("pointerup", onUp);
  }, [item, cardRef, onChange]);

  const c = def.color;

  return (
    <div
      onPointerDown={startDrag}
      style={{
        position: "absolute",
        top:    `${item.top}%`,
        left:   `${item.left}%`,
        width:  `${item.w}%`,
        height: `${item.h}%`,
        boxSizing: "border-box",
        border: `1.5px dashed ${c}`,
        cursor: "grab",
        zIndex: 10,
        userSelect: "none",
      }}
    >
      {/* Label */}
      <span style={{
        position: "absolute", top: -14, left: 0,
        fontSize: 9, fontWeight: 700, color: c,
        background: "#0b1622cc", padding: "1px 3px", borderRadius: 2,
        whiteSpace: "nowrap", pointerEvents: "none",
      }}>
        {def.label}
      </span>

      {/* Sticker image (if applicable) */}
      {def.src && (
        <img src={def.src} draggable={false} style={{
          width: "100%", height: "100%", objectFit: "contain",
          display: "block", pointerEvents: "none", userSelect: "none", opacity: 0.85,
        }} />
      )}

      {/* Name textbox preview */}
      {!def.src && (
        <div style={{
          width: "100%", height: "100%",
          background: `${c}22`,
          display: "flex", alignItems: "center", padding: "0 4px",
          boxSizing: "border-box",
        }}>
          <span style={{ fontSize: 9, color: c, fontFamily: "Georgia, serif", pointerEvents: "none" }}>
            Aa
          </span>
        </div>
      )}

      {/* Right-edge handle — width */}
      <div
        onPointerDown={startResizeW}
        style={{
          position: "absolute", top: 0, right: 0,
          width: 7, height: "100%",
          cursor: "e-resize", background: `${c}66`, zIndex: 11,
        }}
      />

      {/* Bottom-edge handle — height */}
      <div
        onPointerDown={startResizeH}
        style={{
          position: "absolute", bottom: 0, left: 0,
          width: "calc(100% - 10px)", height: 7,
          cursor: "s-resize", background: `${c}66`, zIndex: 11,
        }}
      />

      {/* Bottom-right corner — free resize (textbox) or ratio-locked (sticker) */}
      <div
        onPointerDown={def.freeResize ? startResizeFree : startResizeRatio}
        style={{
          position: "absolute", bottom: 0, right: 0,
          width: 12, height: 12,
          cursor: "se-resize", background: c, zIndex: 12,
        }}
      />
    </div>
  );
}

// ── One role card with all overlays ──────────────────────────────────────────
function CalCard({
  roleId, roleSrc, roleName, cal, onChange,
}: {
  roleId: string;
  roleSrc: string;
  roleName: string;
  cal: CharacterCalData;
  onChange: (key: keyof CharacterCalData, next: CharCalItem) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const visibleItems = ITEMS.filter(def => !def.generalistOnly || roleId === "generalist");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{
        fontSize: 10, color: "#7aafdd", textAlign: "center",
        fontFamily: "system-ui", fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        {roleName}
      </div>
      <div ref={cardRef} style={{ position: "relative", display: "inline-block" }}>
        <img
          src={roleSrc}
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block", userSelect: "none", pointerEvents: "none" }}
        />
        {visibleItems.map(def => (
          <CalOverlayItem
            key={def.key}
            item={cal[def.key]}
            def={def}
            cardRef={cardRef}
            onChange={next => onChange(def.key, next)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main calibration page ─────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

export function CharacterCalibrate({ onClose }: Props) {
  const [cal, setCal] = useState<CharacterCalData>(() => {
    try {
      const r = localStorage.getItem(LS_CHARACTER_CAL);
      if (r) return JSON.parse(r);
    } catch { /**/ }
    return DEF_CHARACTER_CAL;
  });
  const [saved, setSaved] = useState(false);

  const handleChange = useCallback((key: keyof CharacterCalData, next: CharCalItem) => {
    setCal(prev => ({ ...prev, [key]: next }));
    setSaved(false);
  }, []);

  const handleSave = () => {
    localStorage.setItem(LS_CHARACTER_CAL, JSON.stringify(cal));
    setSaved(true);
  };

  const handleReset = () => {
    setCal(DEF_CHARACTER_CAL);
    setSaved(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(4,8,18,0.92)",
      zIndex: 2000, overflowY: "auto",
      display: "flex", flexDirection: "column",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 20px", borderBottom: "1px solid #1e3555",
        background: "#0d1b2e", flexShrink: 0,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#e4f0ff" }}>
          Character Card Calibration
        </div>
        <div style={{ fontSize: 11, color: "#556", flex: 1 }}>
          Drag overlays to position · drag right edge to resize width · drag bottom edge / corner to resize height (name only)
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {ITEMS.map(def => (
            <span key={def.key} style={{ fontSize: 10, color: def.color, fontWeight: 700, opacity: def.generalistOnly ? 0.7 : 1 }}>
              ▪ {def.label}{def.generalistOnly ? " *" : ""}
            </span>
          ))}
        </div>

        <button onClick={handleReset} style={{
          padding: "4px 10px", fontSize: 11, borderRadius: 5, cursor: "pointer",
          background: "transparent", border: "1px solid #2a4060", color: "#7aafdd",
        }}>Reset</button>

        <button onClick={handleSave} style={{
          padding: "6px 18px", fontSize: 13, fontWeight: 700, borderRadius: 6, cursor: "pointer",
          background: saved ? "#1a6a30" : "linear-gradient(135deg, #1a9940, #22cc55)",
          color: "#fff", border: "none", boxShadow: "0 2px 12px #22cc5544",
        }}>
          {saved ? "✓ Saved" : "Save"}
        </button>

        <button onClick={onClose} style={{
          padding: "4px 10px", fontSize: 11, borderRadius: 5, cursor: "pointer",
          background: "transparent", border: "1px solid #3a2020", color: "#c06060",
        }}>✕ Close</button>
      </div>

      {/* Values display */}
      <div style={{
        padding: "6px 20px", background: "#080f1a", borderBottom: "1px solid #1a2a3a",
        display: "flex", gap: 16, flexWrap: "wrap", flexShrink: 0,
      }}>
        {ITEMS.map(def => {
          const v = cal[def.key];
          return (
            <span key={def.key} style={{ fontSize: 10, color: def.color, fontFamily: "monospace" }}>
              {def.label}: top={v.top.toFixed(1)}% left={v.left.toFixed(1)}% w={v.w.toFixed(1)}% h={v.h.toFixed(1)}%
            </span>
          );
        })}
      </div>

      {/* Cards grid */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 16 }}>
          {ROLES.slice(0, 2).map(role => (
            <div key={role.id} style={{ flex: 1 }}>
              <CalCard
                roleId={role.id}
                roleSrc={role.src}
                roleName={role.name}
                cal={cal}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {ROLES.slice(2).map(role => (
            <div key={role.id} style={{ flex: 1 }}>
              <CalCard
                roleId={role.id}
                roleSrc={role.src}
                roleName={role.name}
                cal={cal}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
