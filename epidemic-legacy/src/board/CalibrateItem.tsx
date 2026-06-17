import { useState } from "react";

// Reusable calibration scaffold. Drop this in (gated by `calibrating`) inside the
// board <div ref={boardRef}> to find an item's position: drag to move, drag the ↘
// corner to resize, click "copy" to put the live { x, y, w } on the clipboard.
// Once the coordinate is recorded as a hard-coded constant, delete the instance.
// See the calibration protocol memory for the full 4-step workflow.

export type CalPos = { x: number; y: number; w: number };

export function CalibrateItem({
  src, boardRef, initial, label, resizable = true,
}: {
  src: string;
  boardRef: React.RefObject<HTMLDivElement | null>;
  initial: CalPos;
  label: string;            // copy output key, e.g. "endgameUpgrade"
  resizable?: boolean;
}) {
  const [pos, setPos] = useState<CalPos>(initial);

  const startDrag = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const el = e.currentTarget as HTMLElement; el.setPointerCapture(e.pointerId);
    const r = boardRef.current!.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, ox = pos.x, oy = pos.y;
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
      moved = true;
      setPos(p => ({ ...p,
        x: ox + (ev.clientX - sx) / r.width * 100,
        y: oy + (ev.clientY - sy) / r.height * 100 }));
    };
    const onUp = () => { el.removeEventListener("pointermove", onMove as EventListener); el.removeEventListener("pointerup", onUp); };
    el.addEventListener("pointermove", onMove as EventListener); el.addEventListener("pointerup", onUp);
  };

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const el = e.currentTarget as HTMLElement; el.setPointerCapture(e.pointerId);
    const r = boardRef.current!.getBoundingClientRect();
    const sx = e.clientX, ow = pos.w;
    const onMove = (ev: PointerEvent) => setPos(p => ({ ...p, w: Math.max(0.5, ow + (ev.clientX - sx) / r.width * 100) }));
    const onUp = () => { el.removeEventListener("pointermove", onMove as EventListener); el.removeEventListener("pointerup", onUp); };
    el.addEventListener("pointermove", onMove as EventListener); el.addEventListener("pointerup", onUp);
  };

  const copy = () => {
    const text = `${label}: { x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, w: ${pos.w.toFixed(2)} }`;
    const ta = document.createElement("textarea"); ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta); ta.select(); document.execCommand("copy");
    document.body.removeChild(ta); alert("Copied: " + text);
  };

  return (
    <div onPointerDown={startDrag}
      style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, width: `${pos.w}%`,
        transform: "translate(-50%,-50%)", cursor: "grab", zIndex: 50, outline: "1px dashed #3ddc6d" }}>
      <img src={src} draggable={false}
        style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none", userSelect: "none" }} />
      {resizable && (
        <div onPointerDown={startResize}
          style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, background: "#3ddc6d", cursor: "se-resize" }} />
      )}
      <button onClick={copy} onPointerDown={e => e.stopPropagation()}
        style={{ position: "absolute", top: -20, left: 0, fontSize: 10, whiteSpace: "nowrap",
          background: "#102030", color: "#7bc4ff", border: "1px solid #3a6aaa", borderRadius: 3, cursor: "pointer" }}>
        copy {label}
      </button>
    </div>
  );
}
