// Sandbox — isolated workbench for redesigning the approach-strip "blank panel".
// Reached via http://localhost:5176/guysky-v3/?sandbox  (the real app is untouched).
//
// The live blank panel is the 197×99 blankpanel.png used in App.jsx's approach
// strip, with plane-slot symbols + plane tokens overlaid. Here we render ONE
// panel by itself, scaled up, so we can iterate on the design in isolation.
// Once it looks right we port the markup back into App.jsx.

import { useState, useEffect, useRef } from 'react'
import blankPanelImg from './assets/components/blankpanel.png'
import blackCubeImg from './assets/components/blackcube.png'

// ── CSS-drawn approach symbols (no PNGs) ────────────────────────────────────
// Red X, and a down-pointing triangle (outline or filled). The triangles use
// the classic CSS border trick; the outline variant stacks a white inner
// triangle (the box background is white) to leave a green rim.
const RED = '#e23b2e'
const GREEN = '#2f9e3a'

function Cross({ size }) {
  const bar = {
    position: 'absolute', left: '50%', top: '50%', width: size, height: size * 0.26,
    background: RED, borderRadius: size * 0.13,
  }
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div style={{ ...bar, transform: 'translate(-50%,-50%) rotate(45deg)' }} />
      <div style={{ ...bar, transform: 'translate(-50%,-50%) rotate(-45deg)' }} />
    </div>
  )
}

// Down-pointing triangle as an SVG polygon: a green stroke of uniform thickness
// on all three sides. `fill` paints the interior ('none' = hollow, '#000' for
// the middle slot's black-filled triangle).
function DownTriangle({ size, fill }) {
  const sw = size * 0.09          // stroke (rim) thickness
  const p = sw / 2 + 0.5          // inset so the stroke isn't clipped
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <polygon
        points={`${p},${p} ${size - p},${p} ${size / 2},${size - p}`}
        fill={fill}
        stroke={GREEN}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Native dimensions of the panel image (matches BLANK_W / BLANK_H in App.jsx).
const BLANK_W = 197
const BLANK_H = 99
const ZOOM = 2.5 // blow it up so details are easy to work on

export default function Sandbox() {
  // Cargo cubes: click the box to cycle 0 → 1 → 2 → 3 → 4 → 0.
  const [cubes, setCubes] = useState(0)
  const CUBE = 48 // native cube size (px, pre-zoom)

  // Upper approach box: 5 symbols fanned in an arch, each toggling X ↔ triangle.
  // Box turns off when all 5 are the same; clicking the placeholder restores a
  // mixed default so it doesn't immediately turn off again.
  const MIXED = ['T', 'T', 'T', 'T', 'X']
  const [upperOn, setUpperOn] = useState(true)
  const [marks, setMarks] = useState(MIXED)
  const SYM = 30           // symbol display size (px, pre-zoom)
  // Fan splays outward like the reference: left slots tilt left, right slots
  // tilt right, middle upright — all symbols (X and triangle) share the tilt.
  const ARCH_DROP = [30, 9, 0, 9, 30]      // per-slot vertical drop → dome (middle highest)
  const SHIFT_X = [14, 0, 0, 0, -14]       // pull the outer symbols inward

  // EDIT MODE: click a symbol to toggle X↔triangle; scroll-wheel over it to
  // rotate. X and triangle keep SEPARATE per-slot angles, so rotating a slot
  // only changes the angle of the shape currently shown. The readout (and
  // window.__triAngles / window.__xAngles) shows both sets for baking in.
  const EDIT = false
  const [triAngles, setTriAngles] = useState([-74, -40, 0, 40, 74])
  const [xAngles, setXAngles] = useState([-51, -42, 0, 42, 51])
  const angleFor = (i, m) => (m === 'X' ? xAngles[i] : triAngles[i])
  const boxRef = useRef(null)
  useEffect(() => { window.__triAngles = triAngles; window.__xAngles = xAngles }, [triAngles, xAngles])
  useEffect(() => {
    const el = boxRef.current
    if (!el || !EDIT) return
    const onWheel = (e) => {
      const slot = e.target.closest('[data-slot]')
      if (!slot) return
      e.preventDefault()
      const i = +slot.dataset.slot
      const step = (e.deltaY > 0 ? 1 : -1) * (e.shiftKey ? 1 : 3)
      const setter = slot.dataset.mark === 'X' ? setXAngles : setTriAngles
      setter(prev => prev.map((a, k) => (k === i ? a + step : a)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [EDIT])
  // ── Hidden value: blocked axis positions ──────────────────────────────────
  // Slots map left→right to axis positions -2,-1,0,1,2. X = blocked,
  // triangle = unblocked. When the box is OFF (placeholder — reached by all-X
  // OR all-triangle) nothing is blocked. This isn't rendered; it's the data the
  // panel exposes (here surfaced on window.__blockedAxes for inspection).
  const AXIS = [-2, -1, 0, 1, 2]
  const blockedAxes = upperOn ? AXIS.filter((_, i) => marks[i] === 'X') : []
  useEffect(() => { window.__blockedAxes = blockedAxes }, [blockedAxes])

  const toggleMark = (i) => {
    setMarks(prev => {
      const next = prev.map((m, k) => (k === i ? (m === 'X' ? 'T' : 'X') : m))
      if (!EDIT && (next.every(m => m === 'X') || next.every(m => m === 'T'))) setUpperOn(false)
      return next
    })
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      background: '#2b3b3f', color: '#cdd', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 13, letterSpacing: 1, opacity: 0.7 }}>
        BLANK PANEL SANDBOX — {BLANK_W}×{BLANK_H} @ {ZOOM}×
      </div>
      {EDIT && (
        <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#9fd', opacity: 0.9, textAlign: 'center', lineHeight: 1.5 }}>
          click = toggle X↔△ · scroll = rotate (shift = fine)<br />
          triAngles = [{triAngles.map(a => Math.round(a)).join(', ')}] · xAngles = [{xAngles.map(a => Math.round(a)).join(', ')}]
        </div>
      )}

      {/* The panel under construction. Build the new design INSIDE this box. */}
      <div style={{
        position: 'relative',
        width: BLANK_W * ZOOM,
        height: BLANK_H * ZOOM,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        {/* Current panel background — replace/remove as the redesign takes shape. */}
        <img
          src={blankPanelImg}
          draggable={false}
          style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
        />

        {/* ── edit the panel content here ─────────────────────────────────── */}

        {/* Upper approach box — top edge flush with the panel's top edge. When
            ON it holds 5 symbols fanned into an arch (each toggles X↔triangle);
            when OFF it collapses to a faint clickable placeholder. */}
        {upperOn ? (
          <div ref={boxRef} style={{
            position: 'absolute',
            left: '50%',
            top: 0, // upper edge flush with the panel's upper edge
            transform: 'translateX(-50%)',
            width: 146,
            height: 68,
            boxSizing: 'border-box',
            padding: '6px 8px 5px', // fit the domed fan inside the box
            borderRadius: 6,
            background: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}>
            {marks.map((m, i) => (
              <div
                key={i}
                data-slot={i}
                data-mark={m}
                onClick={() => toggleMark(i)}
                style={{
                  width: SYM, height: SYM, margin: '0 -2px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: `translate(${SHIFT_X[i]}px, ${ARCH_DROP[i]}px)`, // dome + pull outer in
                }}
              >
                {/* X and triangle each carry their own per-slot angle. */}
                <div style={{ transform: `rotate(${angleFor(i, m)}deg)`, display: 'flex' }}>
                  {m === 'X'
                    ? <Cross size={SYM * 0.8} />
                    : <DownTriangle size={SYM * 0.9} fill={i === 2 ? '#000' : 'none'} />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => { setMarks(MIXED); setUpperOn(true) }}
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              width: SYM * 2,
              height: SYM,
              borderRadius: 6,
              background: '#fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              opacity: 0.25,
              cursor: 'pointer',
            }}
          />
        )}

        {/* Cargo box — straddles the panel's bottom edge, centered. Click to
            cycle cube count. At 0 it stays as a faint placeholder so you can
            bring the cubes back. */}
        <div
          onClick={() => setCubes(c => (c + 1) % 5)}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 0, // white box's lower edge flush with the panel's lower edge
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 8px',
            width: 'max-content',
            minWidth: CUBE,
            minHeight: CUBE,
            borderRadius: 6,
            background: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            cursor: 'pointer',
            opacity: cubes === 0 ? 0.25 : 1,
          }}
        >
          {cubes === 0
            ? <div style={{ width: CUBE, height: CUBE }} />
            : Array.from({ length: cubes }).map((_, i) => (
                <img
                  key={i}
                  src={blackCubeImg}
                  draggable={false}
                  style={{ width: CUBE, height: CUBE, display: 'block', userSelect: 'none' }}
                />
              ))}
        </div>
      </div>
    </div>
  )
}
