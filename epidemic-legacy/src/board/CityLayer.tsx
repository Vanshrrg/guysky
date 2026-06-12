import { useState } from "react";
import { CITIES, WRAP_ROUTES, WRAP_PAIR_KEYS, cityById } from "./cities";

export const LS_ROADBLOCKS = "epidemic.roadblocks.v1";
export type RoadblockState = "temp" | "permanent";

export function loadRoadblocks(): Record<string, RoadblockState> {
  try {
    const raw = localStorage.getItem(LS_ROADBLOCKS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function saveRoadblocks(rb: Record<string, RoadblockState>) {
  const perm: Record<string, RoadblockState> = {};
  for (const [k, v] of Object.entries(rb)) if (v === "permanent") perm[k] = v;
  localStorage.setItem(LS_ROADBLOCKS, JSON.stringify(perm));
}

/** Edge key for two city IDs: alphabetically smaller first, joined by "-" */
export function edgeKey(a: string, b: string) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

interface CityLayerProps {
  onCityClick?: (cityId: string, e: React.MouseEvent) => void;
  onCityRightClick?: (cityId: string, e: React.MouseEvent) => void;
  roadblocks?: Record<string, RoadblockState>;
  onRoadblockChange?: (rb: Record<string, RoadblockState>) => void;
  roadblocksEnabled?: boolean;
  highlightCities?: string[];
  highlightClickOnly?: boolean;
}

export function CityLayer({ onCityClick, onCityRightClick, roadblocks: rbProp, onRoadblockChange, roadblocksEnabled = false, highlightCities, highlightClickOnly = false }: CityLayerProps = {}) {
  const highlightSet = new Set(highlightCities ?? []);
  // If no external roadblocks provided, manage locally (backward compat)
  const [localRb, setLocalRb] = useState<Record<string, RoadblockState>>(loadRoadblocks);
  const roadblocks = rbProp ?? localRb;

  const setRoadblocks = (updater: (prev: Record<string, RoadblockState>) => Record<string, RoadblockState>) => {
    const next = updater(roadblocks);
    if (onRoadblockChange) {
      onRoadblockChange(next);
    } else {
      setLocalRb(next);
    }
    saveRoadblocks(next);
  };

  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const handleClick = (key: string) => {
    setRoadblocks(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = "temp";
      return next;
    });
  };

  const handleRightClick = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    setRoadblocks(prev => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: "permanent" as const };
    });
  };

  // Build edges.
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; key: string; wrap?: boolean }> = [];
  for (const c of CITIES) {
    for (const n of c.neighbors) {
      if (c.id >= n) continue;
      const pairKey = [c.id, n].sort().join("|");
      if (WRAP_PAIR_KEYS.has(pairKey)) continue;
      const b = cityById(n)?.pos;
      if (b) edges.push({ x1: c.pos.x, y1: c.pos.y, x2: b.x, y2: b.y, key: `${c.id}-${n}` });
    }
  }
  for (const w of WRAP_ROUTES) {
    const a = cityById(w.a)?.pos;
    const b = cityById(w.b)?.pos;
    if (a) edges.push({ x1: a.x, y1: a.y, x2: w.left.x, y2: w.left.y, key: `${w.a}-${w.b}-L`, wrap: true });
    if (b) edges.push({ x1: b.x, y1: b.y, x2: w.right.x, y2: w.right.y, key: `${w.a}-${w.b}-R`, wrap: true });
  }

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>

        {/* Visual lines */}
        {edges.map(e => (
          <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="#ffffff"
            strokeOpacity={e.wrap ? 0 : 0.45}
            strokeWidth={e.wrap ? 0 : 0.25}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke" />
        ))}

        {/* Invisible wide hit-targets */}
        {edges.map(e => (
          <line key={`hit-${e.key}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="transparent"
            strokeWidth={8}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ cursor: "pointer", pointerEvents: "stroke" }}
            onClick={roadblocksEnabled ? () => handleClick(e.key) : undefined}
            onContextMenu={roadblocksEnabled ? (ev) => handleRightClick(e.key, ev) : undefined} />
        ))}

        {/* Roadblock X markers */}
        {edges.map(e => {
          const rb = roadblocks[e.key];
          if (!rb) return null;
          const mx = (e.x1 + e.x2) / 2;
          const my = (e.y1 + e.y2) / 2;
          const color = rb === "permanent" ? "#ff2222" : "#ff5555";
          return (
            <g key={`rb-${e.key}`} style={{ pointerEvents: "none" }}>
              <line x1={mx - 0.7} y1={my - 0.7} x2={mx + 0.7} y2={my + 0.7}
                stroke={color} strokeWidth={rb === "permanent" ? 2 : 1.5}
                strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <line x1={mx + 0.7} y1={my - 0.7} x2={mx - 0.7} y2={my + 0.7}
                stroke={color} strokeWidth={rb === "permanent" ? 2 : 1.5}
                strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>

      {CITIES.map(c => {
        const isHighlighted = highlightSet.has(c.id);
        const clickable = onCityClick && (!highlightClickOnly || isHighlighted);
        return (
        <div key={c.id}
          onMouseEnter={() => setHoveredCity(c.id)}
          onMouseLeave={() => setHoveredCity(null)}
          onClick={e => {
            e.stopPropagation();
            if (!clickable) return;
            onCityClick!(c.id, e);
          }}
          onContextMenu={e => { e.stopPropagation(); e.preventDefault(); onCityRightClick?.(c.id, e); }}
          style={{
            position: "absolute",
            left: `${c.pos.x}%`, top: `${c.pos.y}%`,
            transform: "translate(-50%, -50%)",
            width: "3%", aspectRatio: "1",
            borderRadius: "50%",
            pointerEvents: "auto",
            cursor: clickable ? "pointer" : "default",
            boxShadow: isHighlighted ? "0 0 0 3px #ffdd44, 0 0 14px 4px #ffdd4488" : "none",
            transition: "box-shadow 0.15s",
          }}>
          {hoveredCity === c.id && (
            <span style={{
              position: "absolute",
              top: "100%", left: "50%",
              transform: "translateX(-50%)",
              marginTop: 3,
              fontFamily: "system-ui, sans-serif",
              fontSize: 13, lineHeight: 1, fontWeight: 700,
              color: "#fff", whiteSpace: "nowrap",
              textShadow: "0 0 4px #000, 0 0 4px #000, 0 0 4px #000",
              pointerEvents: "none",
            }}>{c.name}</span>
          )}
        </div>
        );
      })}
    </div>
  );
}
