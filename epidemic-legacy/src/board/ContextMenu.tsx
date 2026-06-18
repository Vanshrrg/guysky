import React from "react";

/**
 * Shared primitives for the board's right-click / pop-up menus.
 *
 * `ContextMenu` renders the full-screen click-catcher (closes on outside
 * click) plus a `position: fixed` menu box anchored at (x, y). Pass the menu
 * rows as children — either `<MenuItem>`s for the common list case, or
 * arbitrary JSX (e.g. the city menu's hover submenus).
 *
 * Two visual variants match the two styles already used on the board:
 *   - "dark"  — slate `#111418` box, light grey rows (city / deck-action menus)
 *   - "blue"  — `#1a2550` box with border, monospace rows (objective / deck menus)
 */
export type MenuVariant = "dark" | "blue";

const WRAP: Record<MenuVariant, React.CSSProperties> = {
  dark: {
    background: "#111418", borderRadius: 5, boxShadow: "0 4px 20px #000c",
    overflow: "hidden", fontFamily: "system-ui, sans-serif", fontSize: 12,
  },
  blue: {
    background: "#1a2550", border: "1px solid #445", borderRadius: 6,
    boxShadow: "0 4px 16px #000a", overflow: "hidden",
  },
};

export function ContextMenu({
  x, y, onClose, variant = "dark", minWidth, overlayZIndex = 999, wrapStyle, children,
}: {
  x: number;
  y: number;
  onClose: () => void;
  variant?: MenuVariant;
  minWidth?: number;
  /** Overlay (and therefore global) stacking order. Defaults to 999. */
  overlayZIndex?: number;
  /** Extra styles merged into the menu box (e.g. `overflow: "visible"`, padding). */
  wrapStyle?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: overlayZIndex }}>
      <div onClick={e => e.stopPropagation()}
        style={{ position: "fixed", left: x, top: y, minWidth, ...WRAP[variant], ...wrapStyle }}>
        {children}
      </div>
    </div>
  );
}

const ROW: Record<MenuVariant, { padding: string; color: string; hover: string; extra?: React.CSSProperties }> = {
  dark: { padding: "8px 14px", color: "#e8e8e8", hover: "#23282f" },
  blue: { padding: "10px 16px", color: "#cde", hover: "#2a3d7a", extra: { fontSize: 13, fontFamily: "monospace" } },
};

/** A single hover-highlighting menu row. Disabled rows are greyed and inert. */
export function MenuItem({
  children, onClick, disabled = false, variant = "dark", color, padding, radius,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: MenuVariant;
  /** Override the default row text colour. */
  color?: string;
  /** Override the default row padding. */
  padding?: string;
  /** Optional row border-radius (used by the player-deck menu). */
  radius?: number;
}) {
  const v = ROW[variant];
  return (
    <div onClick={disabled ? undefined : onClick}
      style={{
        padding: padding ?? v.padding,
        color: disabled ? "#555" : (color ?? v.color),
        cursor: disabled ? "default" : "pointer",
        borderRadius: radius,
        ...v.extra,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = v.hover; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      {children}
    </div>
  );
}
