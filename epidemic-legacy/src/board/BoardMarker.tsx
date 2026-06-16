// Draggable image marker. Position stored as % of board frame.
// In calibrate mode: drag to move. Size and rotation are fixed (set in Board.tsx).

import { useRef, memo } from "react";

export interface MarkerState {
  x: number;   // % from left (center)
  y: number;   // % from top  (center)
  w: number;   // % of board width
  rot: number; // degrees (fixed, not editable in UI)
}

interface Props {
  src: string;
  alt: string;
  aspectRatio: number;
  state: MarkerState;
  calibrating: boolean;
  onChange: (s: MarkerState) => void;
  tintColor?: string;
  /** CSS filter applied to the raw image (e.g. hue-rotate for recoloring). Takes precedence over tintColor. */
  cssFilter?: string;
  /** When set, renders an SVG 3D cube instead of the tinted image. */
  cubeColor?: string;
  /** Show 🚫 overlay — token is eradicated. */
  eradicated?: boolean;
  /** Stroke color for the eradicated symbol (default white). */
  eradicatedColor?: string;
  /** Called on click when not calibrating — used to toggle eradication. */
  onActivate?: () => void;
}

// Blend hex color toward white (amount 0–1) for the top face highlight.
function blendWhite(hex: string, amount: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount) + 255 * amount);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount) + 255 * amount);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount) + 255 * amount);
  return `rgb(${r},${g},${b})`;
}

// Scale hex color brightness for shadow face.
function scaleColor(hex: string, factor: number): string {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * factor));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * factor));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * factor));
  return `rgb(${r},${g},${b})`;
}

export { blendWhite, scaleColor };

// SVG isometric cube: top face lit, left face mid, right face shadow.
// ViewBox 0 0 100 100. Geometry matches a cube seen from upper-left at 30°.
export function CubeSvg({ color }: { color: string }) {
  const top   = color;                      // base face
  const left  = scaleColor(color, 0.52);   // shadow face
  const right = blendWhite(color, 0.32);   // highlight face

  return (
    <svg
      viewBox="0 0 100 100"
      style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
    >
      {/* Top face */}
      <polygon points="50,8 84,27 50,46 16,27" fill={top} />
      {/* Left face */}
      <polygon points="16,27 50,46 50,82 16,63" fill={left} />
      {/* Right face (shadow) */}
      <polygon points="50,46 84,27 84,63 50,82" fill={right} />
      {/* Edge lines for crispness */}
      <polygon points="50,8 84,27 50,46 16,27" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
      <polygon points="16,27 50,46 50,82 16,63" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
      <polygon points="50,46 84,27 84,63 50,82" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
    </svg>
  );
}

export const BoardMarker = memo(function BoardMarker({ src, alt, aspectRatio, state, calibrating, onChange, tintColor, cssFilter, cubeColor, eradicated, eradicatedColor = "white", onActivate }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragMoved = useRef(false);
  const start = useRef({ px: 0, py: 0, x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    if (!calibrating && !onActivate) return;
    e.preventDefault();
    if (calibrating) {
      dragging.current = true;
      dragMoved.current = false;
      start.current = { px: e.clientX, py: e.clientY, x: state.x, y: state.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !calibrating) return;
    const board = frameRef.current?.parentElement;
    if (!board) return;
    const { width, height } = board.getBoundingClientRect();
    dragMoved.current = true;
    onChange({
      ...state,
      x: start.current.x + ((e.clientX - start.current.px) / width) * 100,
      y: start.current.y + ((e.clientY - start.current.py) / height) * 100,
    });
  };

  const onPointerUp = () => { dragging.current = false; };

  const onClick = () => {
    if (calibrating || dragMoved.current) return;
    onActivate?.();
  };

  const interactive = calibrating || !!onActivate;

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
      style={{
        position: "absolute",
        left: `${state.x}%`,
        top: `${state.y}%`,
        width: `${state.w}%`,
        aspectRatio: `${aspectRatio}`,
        transform: `translate(-50%, -50%) rotate(${state.rot}deg)`,
        cursor: calibrating ? "grab" : onActivate ? "pointer" : "default",
        userSelect: "none",
        touchAction: "none",
        pointerEvents: interactive ? "auto" : "none",
        zIndex: calibrating ? 20 : undefined,
      }}
    >
      {cubeColor ? (
        <CubeSvg color={cubeColor} />
      ) : tintColor ? (
        <div style={{
          width: "100%", height: "100%",
          background: tintColor,
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          pointerEvents: "none",
          ...(cssFilter ? { filter: cssFilter } : {}),
        }} />
      ) : cssFilter ? (
        <img src={src} alt={alt} draggable={false}
          style={{ width: "100%", height: "100%", display: "block", userSelect: "none", pointerEvents: "none", filter: cssFilter }} />
      ) : (
        <img src={src} alt={alt} draggable={false}
          style={{ width: "100%", height: "100%", display: "block", userSelect: "none", pointerEvents: "none" }} />
      )}

      {/* Eradication overlay — white circle + diagonal bar, transparent interior */}
      {eradicated && (
        <svg
          viewBox="0 0 100 100"
          style={{ position: "absolute", inset: "25%", width: "50%", height: "50%", pointerEvents: "none" }}
        >
          <defs>
            <filter id="erad-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#000" floodOpacity="0.8" />
            </filter>
          </defs>
          <g filter="url(#erad-shadow)">
            <circle cx="50" cy="50" r="38" fill="none" stroke={eradicatedColor} strokeWidth="9" />
            <line x1="77" y1="23" x2="23" y2="77" stroke={eradicatedColor} strokeWidth="9" strokeLinecap="round" />
          </g>
        </svg>
      )}
    </div>
  );
});
