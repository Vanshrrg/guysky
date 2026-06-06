import React, { useState, useEffect, useRef, useReducer } from 'react'
import background from './assets/components/background.png'
import DiceTray from './components/DiceTray'
import Die from './components/Die'
import Switch from './components/Switch'
import plane90 from './assets/components/Planeaxis90_update.png'
import rerollImg from './assets/components/reroll.png'
import redbrakeImg from './assets/components/redbrake.png'
import brake2Img from './assets/components/brake2.png'
import brake3Img from './assets/components/brake3.png'
import brake4Img from './assets/components/brake4.png'
import blueEngineImg from './assets/components/blue_engine.png'
import blueEngine2Img from './assets/components/blue_engine2.png'
import blueEngine3Img from './assets/components/blue_engine3.png'
import blueEngine4Img from './assets/components/blue_engine4.png'
import orangeEngineImg from './assets/components/orangeengine.png'
import orangeEngine2Img from './assets/components/orangeengine2.png'
import orangeEngine3Img from './assets/components/orangeengine3.png'
import orangeEngine4Img from './assets/components/orangeengine4.png'
import orangeEngine5Img from './assets/components/orangeengine5.png'
import coffeeToken from './assets/components/coffeetokenupdate.png'
import altitudeStripImg from './assets/components/altitudestrip.png'
import planeTokenImg from './assets/components/plane_token.png'
import destinationPanelImg from './assets/components/destinationpanel.png'
import blankPanelImg from './assets/components/blankpanel.png'
import altitude5000Img from './assets/components/altitude5000.png'
import altitude4000Img from './assets/components/altitude4000.png'
import altitude3000Img from './assets/components/altitude3000.png'
import altitude1000Img from './assets/components/altitude1000.png'
import altitude0Img from './assets/components/altitude0.png'
import altitude2000Img from './assets/components/altitude2000.png'
import { gameReducer, initialState, BLUE_ENGINE_VALUES, ORANGE_ENGINE_VALUES, computeLandingResult } from './gameState'
import { useFirebaseSync, fbSet } from './hooks/useFirebaseSync'
import './App.css'

// The board is a fixed-size canvas; everything (board art + future drop
// zones, switches, markers) lives inside it, and we scale the whole canvas
// as one unit so pixel positions stay valid on phone / iPad / PC.
// Height is derived from the real background image aspect (768x1078) so the
// canvas exactly matches the artwork and nothing overflows it.
const BOARD_W = 706
const BOARD_H = Math.round(BOARD_W * 1078 / 768) // ≈ 991
// A die slot measures 72px in the native 768-wide artwork (see
// components/sizeref.png). Converted to our 706-wide canvas: 72*706/768 ≈ 66.
const SQUARE = Math.round(72 * BOARD_W / 768) // ≈ 66
const NATIVE = 90 // Die's intrinsic px size
const DRAG_THRESHOLD = 4 // px of movement before a press becomes a drag

// Altitude strip — locked calibration
const ALT_STRIP_X = 389
const ALT_STRIP_W = 197
const ALT_STRIP_H = 691

// The full set of dice. Each has a stable id so we can track whether it's
// sitting in its tray or placed on the board.
const ALL_DICE = [
  { id: 'blue-1', color: 'blue', value: 1 },
  { id: 'blue-2', color: 'blue', value: 2 },
  { id: 'blue-3', color: 'blue', value: 3 },
  { id: 'blue-4', color: 'blue', value: 4 },
  { id: 'orange-1', color: 'orange', value: 1 },
  { id: 'orange-2', color: 'orange', value: 2 },
  { id: 'orange-3', color: 'orange', value: 3 },
  { id: 'orange-4', color: 'orange', value: 4 },
]

function useBoardScale() {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      // Use clientWidth/Height (the layout viewport) rather than
      // window.innerWidth — the latter can include overflow and feed back
      // into itself, letting the board grow wider than the screen.
      const el = document.documentElement
      const s = Math.min(
        1,
        el.clientWidth / BOARD_W,
        el.clientHeight / BOARD_H
      )
      setScale(s)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return scale
}

// Switch image (on/off_switchupdate.png) is 81×44 native → scaled to canvas.
const SW_W = Math.round(81 * BOARD_W / 768)  // 74
const SW_H = Math.round(44 * BOARD_W / 768)  // 40

// Switch top-left positions, measured directly from the switch housings drawn
// into background.png (native 768-wide space) so each overlay sits exactly on
// top of the painted switch. SW_DY nudges every switch vertically (native px)
// for fine alignment. Converted to canvas with px().
const SW_DY = -2
const px = (n) => n * BOARD_W / 768
const slot = (x, y) => ({ x: Math.round(px(x)), y: Math.round(px(y + SW_DY)) })

const LANDING_GEAR_POS = [
  slot(26, 495),
  slot(26, 666),
  slot(26, 836),
]
const FLAP_POS = [
  slot(666, 495),  // +1: was a touch high
  slot(666, 666),
  slot(666, 836),
  slot(666, 1006), // +1: was a touch high
]
const BRAKE_POS = [
  slot(231, 878),  // +1
  slot(347, 878),  // +1
  slot(463, 878),  // +1
]

// Brake marker — single token, radio-style across 4 spaces (built up one at a time)
// Each entry: { x, y } top-left in canvas coords, image to show
const BRAKE_MARKER_POS = [
  { x: Math.round(px(220)) - 10, y: Math.round(px(660)) - 12, w: Math.round(px(71)), h: Math.round(px(69)), img: redbrakeImg, value: 1.5 },
  { x: Math.round(px(252)) + 23, y: Math.round(px(693)) - 3,   w: Math.round(px(44)), h: Math.round(px(55)), img: brake2Img,  value: 2.5 },
  { x: Math.round(px(403)),      y: Math.round(px(711)) - 6,    w: Math.round(px(37)), h: Math.round(px(56)), img: brake3Img,  value: 4.5 },
  { x: Math.round(px(503)),      y: Math.round(px(671)) - 14,   w: Math.round(px(50)), h: Math.round(px(54)), img: brake4Img,  value: 6.5 },
]

// Blue engine marker — 4 positions, built up one at a time
const BLUE_ENGINE_POS = [
  { x: Math.round(px(196)) + 15, y: Math.round(px(448)) - 6, w: Math.round(px(60)), h: Math.round(px(67)), img: blueEngineImg },
  { x: Math.round(px(273)),      y: Math.round(px(524)) - 39, w: Math.round(px(42)), h: Math.round(px(52)), img: blueEngine2Img },
  { x: Math.round(px(337)),      y: Math.round(px(518)) - 18, w: Math.round(px(36)), h: Math.round(px(55)), img: blueEngine3Img },
  { x: Math.round(px(400)),      y: Math.round(px(478)) + 18, w: Math.round(px(36)), h: Math.round(px(55)), img: blueEngine4Img },
]

// Orange engine marker — 5 positions, built up one at a time
const ORANGE_ENGINE_POS = [
  { x: Math.round(px(450)) - 9, y: Math.round(px(495)) - 21, w: Math.round(px(64)), h: Math.round(px(69)), img: orangeEngineImg },
  { x: Math.round(px(500)),     y: Math.round(px(439)) + 10,  w: Math.round(px(48)), h: Math.round(px(52)), img: orangeEngine2Img },
  { x: Math.round(px(541)),     y: Math.round(px(399)) + 4,   w: Math.round(px(54)), h: Math.round(px(47)), img: orangeEngine3Img },
  { x: Math.round(px(565)),     y: Math.round(px(357)),       w: Math.round(px(57)), h: Math.round(px(38)), img: orangeEngine4Img },
  { x: Math.round(px(275)) + 276, y: Math.round(px(294)) - 2, w: Math.round(px(56)), h: Math.round(px(35)), img: orangeEngine5Img },
]

// Unified snap-tray registry. Each tray has:
//   name        — unique key, used as trayDice key
//   group       — trays in the same group cascade when one is cleared
//   x, y        — canvas top-left of the snap target (SQUARE × SQUARE)
//   snapR       — snap radius (canvas px)
//   acceptColor — die color that is accepted
//   acceptValues — array of face values that are accepted
//   prereq(gs)  — returns true when the tray is unlocked (gs = { brakes, flaps })
//   onSnap(dispatch, gs) — side-effect when a valid die snaps in
const TRAYS = [
  // ── Landing gear group (3 slots beside gear switches, blue dice) ──────────
  // cascade:false — switches are independent; removing one die doesn't clear others
  { name: 'gear-0', group: 'gear', cascade: false, x: 24, y: 365, snapR: 60,
    acceptColor: 'blue',   acceptValues: [1, 2],
    prereq: ()       => true,
    onSnap: (dispatch, gs) => { if (!gs.landingGear[0]) dispatch({ type: 'TOGGLE_LANDING_GEAR', index: 0 }) } },
  { name: 'gear-1', group: 'gear', cascade: false, x: 27, y: 522, snapR: 60,
    acceptColor: 'blue',   acceptValues: [3, 4],
    prereq: ()       => true,
    onSnap: (dispatch, gs) => { if (!gs.landingGear[1]) dispatch({ type: 'TOGGLE_LANDING_GEAR', index: 1 }) } },
  { name: 'gear-2', group: 'gear', cascade: false, x: 26, y: 676, snapR: 60,
    acceptColor: 'blue',   acceptValues: [5, 6],
    prereq: ()       => true,
    onSnap: (dispatch, gs) => { if (!gs.landingGear[2]) dispatch({ type: 'TOGGLE_LANDING_GEAR', index: 2 }) } },

  // ── Brake group (3 slots above brake switches, blue dice) ──────────────────
  { name: 'brake-0', group: 'brake', x: 216, y: 715, snapR: 60,
    acceptColor: 'blue',   acceptValues: [2],
    prereq: ()       => true,
    onSnap: (dispatch, gs) => { if (!gs.brakes[0]) dispatch({ type: 'TOGGLE_BRAKE', index: 0 }) } },
  { name: 'brake-1', group: 'brake', x: 323, y: 715, snapR: 60,
    acceptColor: 'blue',   acceptValues: [4],
    prereq: (gs)     => gs.brakes[0],
    onSnap: (dispatch, gs) => { if (!gs.brakes[1]) dispatch({ type: 'TOGGLE_BRAKE', index: 1 }) } },
  { name: 'brake-2', group: 'brake', x: 430, y: 715, snapR: 60,
    acceptColor: 'blue',   acceptValues: [6],
    prereq: (gs)     => gs.brakes[0] && gs.brakes[1],
    onSnap: (dispatch, gs) => { if (!gs.brakes[2]) dispatch({ type: 'TOGGLE_BRAKE', index: 2 }) } },

  // ── Flap group (4 slots on flap switches, orange dice) ────────────────────
  { name: 'flap-0', group: 'flap', x: 616, y: 363, snapR: 60,
    acceptColor: 'orange', acceptValues: [1, 2],
    prereq: ()       => true,
    onSnap: (dispatch, gs) => { if (!gs.flaps[0]) dispatch({ type: 'TOGGLE_FLAP', index: 0 }) } },
  { name: 'flap-1', group: 'flap', x: 617, y: 521, snapR: 60,
    acceptColor: 'orange', acceptValues: [2, 3],
    prereq: (gs)     => gs.flaps[0],
    onSnap: (dispatch, gs) => { if (!gs.flaps[1]) dispatch({ type: 'TOGGLE_FLAP', index: 1 }) } },
  { name: 'flap-2', group: 'flap', x: 617, y: 678, snapR: 60,
    acceptColor: 'orange', acceptValues: [4, 5],
    prereq: (gs)     => gs.flaps[1],
    onSnap: (dispatch, gs) => { if (!gs.flaps[2]) dispatch({ type: 'TOGGLE_FLAP', index: 2 }) } },
  { name: 'flap-3', group: 'flap', x: 617, y: 835, snapR: 60,
    acceptColor: 'orange', acceptValues: [5, 6],
    prereq: (gs)     => gs.flaps[2],
    onSnap: (dispatch, gs) => { if (!gs.flaps[3]) dispatch({ type: 'TOGGLE_FLAP', index: 3 }) } },

  // ── Axis trays — blue (left bank) and orange (right bank) ────────────────────
  { name: 'axis-blue', group: 'axis-blue', cascade: false, x: 139, y: 156, snapR: 50,
    acceptColor: 'blue', acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: () => {} },
  { name: 'axis-orange', group: 'axis-orange', cascade: false, x: 505, y: 156, snapR: 50,
    acceptColor: 'orange', acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: () => {} },

  // ── Engine trays — blue + orange die; combined value drives approach distance ─
  { name: 'eng-blue', group: 'eng-blue', cascade: false, x: 213, y: 508, snapR: 50,
    acceptColor: 'blue', acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: () => {} },
  { name: 'eng-orange', group: 'eng-orange', cascade: false, x: 430, y: 508, snapR: 50,
    acceptColor: 'orange', acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: () => {} },

  // ── Radio 2 & 3 — orange any value; store value, placeholder for approach track ──
  { name: 'radio2', group: 'radio2', cascade: false, x: 616, y: 27, snapR: 50,
    acceptColor: 'orange', acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: (dispatch, gs, val) => {
      dispatch({ type: 'SET_RADIO2', value: val })
      dispatch({ type: 'REMOVE_APPROACH_PLANE', distanceValue: val })
    } },
  { name: 'radio3', group: 'radio3', cascade: false, x: 616, y: 141, snapR: 50,
    acceptColor: 'orange', acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: (dispatch, gs, val) => {
      dispatch({ type: 'SET_RADIO3', value: val })
      dispatch({ type: 'REMOVE_APPROACH_PLANE', distanceValue: val })
    } },

  { name: 'radio1', group: 'radio1', cascade: false, x: 22, y: 141, snapR: 50,
    acceptColor: 'blue', acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: (dispatch, gs, val) => {
      dispatch({ type: 'SET_RADIO1', value: val })
      dispatch({ type: 'REMOVE_APPROACH_PLANE', distanceValue: val })
    } },

  // ── Concentration track (3 slots, any die) — toggles coffee tokens in order ─
  // Order: upper (0) → bottom-left (1) → bottom-right (2)
  { name: 'conc-0', group: 'conc', cascade: false, x: 217, y: 891, snapR: 50,
    acceptColor: null, acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: (dispatch, gs) => {
      const next = gs.coffeeTokens.indexOf(false)
      if (next !== -1) dispatch({ type: 'SET_COFFEE_TOKEN', index: next, value: true })
    } },
  { name: 'conc-1', group: 'conc', cascade: false, x: 323, y: 891, snapR: 50,
    acceptColor: null, acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: (dispatch, gs) => {
      const next = gs.coffeeTokens.indexOf(false)
      if (next !== -1) dispatch({ type: 'SET_COFFEE_TOKEN', index: next, value: true })
    } },
  { name: 'conc-2', group: 'conc', cascade: false, x: 429, y: 891, snapR: 50,
    acceptColor: null, acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: (dispatch, gs) => {
      const next = gs.coffeeTokens.indexOf(false)
      if (next !== -1) dispatch({ type: 'SET_COFFEE_TOKEN', index: next, value: true })
    } },
]

// Coffee tokens — 3 slots, native top-left = board anchor minus image anchor (2,1)
const COFFEE_W = Math.round(px(70))
const COFFEE_H = Math.round(px(59))
const COFFEE_POS = [
  { x: Math.round(px(61)), y: Math.round(px(916)) },
  { x: Math.round(px(61)), y: Math.round(px(988)) },
  { x: Math.round(px(140)), y: Math.round(px(988)) },
]

// --- Axis plane (Step 4a: level plane placement) ---
// Compass middlepoint, from the #ffffff dot in centerreference.png (native 768 space).
const COMPASS_CX = 384
const COMPASS_CY = 317
// Planeaxis90_update.png native size and its center pixel (the #000000 dot in
// Planeaxis90_updatecenter.png) — so the plane's center lands on the compass center.
const PLANE90 = { w: 253, h: 239, cx: 126, cy: 128 }
// Rotation handle sits on the dark compass ring (native radius ~143 from center).
// Bank is limited to ±90° (handle travels the top arc between the two red X's).
const AXIS_ARC_R = 143
const AXIS_HANDLE_W = 24                  // handle width (native px)
const AXIS_HANDLE_H = Math.round(24 * 1.5) + 5 // 1.5× taller + 5px; grows upward, bottom edge fixed
const AXIS_MAX = 90      // max bank each way (degrees)
const AXIS_SNAP_ANGLES = [-72.61, -51.30, -26.28, 0, 26.28, 51.30, 72.61]

export default function App() {
  const scale = useBoardScale()
  const canvasRef = useRef(null)
  const [gameState, dispatch] = useReducer(gameReducer, initialState)

  const [trayDice, setTrayDice] = useState(
    () => Object.fromEntries(TRAYS.map(t => [t.name, null]))
  )
  const latestRef = useRef({})

  // Axis plane free-rotation (degrees). Grab the plane and rotate it around the
  // compass center. Not tied to discrete angles — fully manual.
  const [axisAngle, setAxisAngle] = useState(0)
  const axisDragRef = useRef(null)

  // Drag the arc handle to bank the plane. The angle is measured from straight
  // up (12 o'clock = level) clockwise, clamped to ±AXIS_MAX so the handle stays
  // on the top arc. The plane rotates by the same angle around the compass center.
  const startAxisRotate = (e) => {
    if (e.button != null && e.button !== 0) return
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const s = rect.width / BOARD_W
    const cx = rect.left + px(COMPASS_CX) * s
    const cy = rect.top + px(COMPASS_CY) * s
    const calc = (ev) => {
      // angle from top (−Y), clockwise positive
      let deg = Math.atan2(ev.clientX - cx, -(ev.clientY - cy)) * 180 / Math.PI
      deg = Math.max(-AXIS_MAX, Math.min(AXIS_MAX, deg))
      const snapped = AXIS_SNAP_ANGLES.reduce((a, b) => Math.abs(b - deg) < Math.abs(a - deg) ? b : a)
      setAxisAngle(snapped)
    }
    calc(e)
    const move = (ev) => calc(ev)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  // id -> { x, y } in canvas coordinates (top-left). Present = on the board;
  // absent = still in its tray.
  const [placed, setPlaced] = useState({})

  // id -> current face value. Lifted out of <Die> so the value stays the same
  // across tray → drag → board (a rolled die would otherwise revert on move,
  // and the floating drag die could show a different face).
  const [values, setValues] = useState(() =>
    Object.fromEntries(ALL_DICE.map(d => [d.id, d.value]))
  )
  const handleRoll = (id, v) => {
    setValues(s => ({ ...s, [id]: v }))
    setRolledThisAlt(s => new Set([...s, id]))
    setRerollUsed(s => rerollGranted ? new Set([...s, id]) : s)
  }

  // Always-current snapshot used inside event-handler closures to avoid stale state
  latestRef.current = { brakes: gameState.brakes, flaps: gameState.flaps, landingGear: gameState.landingGear, coffeeTokens: gameState.coffeeTokens, trayDice, values }

  // Active custom drag. While moving, we render one opaque die that follows the
  // cursor and hide the die at its source. dragRef mirrors it for the window
  // listeners (which need the latest values without re-subscribing).
  const [drag, setDrag] = useState(null)
  const dragRef = useRef(null)

  const byColor = (c) =>
    ALL_DICE.filter(d => d.color === c && !placed[d.id])
      .map(d => ({ ...d, value: values[d.id] }))

  // A die in the tray is eligible (and highlighted) if it hasn't been rolled this
  // altitude yet, OR the reroll token was spent and it hasn't used its bonus roll.
  const canRollDie = (id) => !rolledThisAlt.has(id) || (rerollGranted && !rerollUsed.has(id))

  // Begin a potential drag. It only becomes a real drag once the pointer moves
  // past DRAG_THRESHOLD, so a simple tap still rolls the die.
  const startDrag = (e, die) => {
    if (setupPhase) return
    if (!rolledThisAlt.has(die.id)) return
    if (!isMyTurn) return
    if (myRole !== null && die.color !== myRole) return
    if (e.button != null && e.button !== 0) return // left / touch / pen only

    // If this die is already snapped to a board tray, it cannot be moved again
    const { trayDice: td } = latestRef.current
    const occupiedTray = TRAYS.find(t => td[t.name] === die.id)
    if (occupiedTray) return

    const rect = e.currentTarget.getBoundingClientRect()
    const info = {
      id: die.id,
      color: die.color,
      value: values[die.id], // current face, so the drag die matches exactly
      ox: e.clientX - rect.left,   // grab offset inside the die (screen px)
      oy: e.clientY - rect.top,
      sx: e.clientX,               // start point (for the move threshold)
      sy: e.clientY,
      px: e.clientX,               // current pointer
      py: e.clientY,
      size: rect.width,            // on-screen die size at grab time
      scale,                       // board scale captured now
      moved: false,
    }
    dragRef.current = info
    setDrag(info)

    const move = (ev) => {
      const d = dragRef.current
      if (!d) return
      d.px = ev.clientX
      d.py = ev.clientY
      if (!d.moved) {
        const dx = ev.clientX - d.sx
        const dy = ev.clientY - d.sy
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) d.moved = true
      }
      setDrag({ ...d })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      finalizeDrag(dragRef.current)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const finalizeDrag = (info) => {
    dragRef.current = null
    setDrag(null)
    if (!info || !info.moved) return // a tap, not a drag — leave die as-is

    const rect = canvasRef.current.getBoundingClientRect()
    const overBoard =
      info.px >= rect.left && info.px <= rect.right &&
      info.py >= rect.top && info.py <= rect.bottom

    if (overBoard) {
      // Place exactly where released (die top-left = pointer - grab offset).
      const screenLeft = info.px - info.ox
      const screenTop = info.py - info.oy
      let x = (screenLeft - rect.left) / info.scale
      let y = (screenTop - rect.top) / info.scale
      x = Math.max(0, Math.min(BOARD_W - SQUARE, x))
      y = Math.max(0, Math.min(BOARD_H - SQUARE, y))

      // Unified snap-tray check: one loop covers all tray groups
      const { brakes, flaps, landingGear, coffeeTokens, trayDice: td, values: vals } = latestRef.current
      const gs = { brakes, flaps, landingGear, coffeeTokens }
      const die = ALL_DICE.find(d => d.id === info.id)
      const dieCx = x + SQUARE / 2
      const dieCy = y + SQUARE / 2
      let snapped = false
      for (const tray of TRAYS) {
        const tCx = tray.x + SQUARE / 2
        const tCy = tray.y + SQUARE / 2
        if (Math.hypot(dieCx - tCx, dieCy - tCy) < tray.snapR) {
          const valid =
            (tray.acceptColor === null || die.color === tray.acceptColor) &&
            tray.acceptValues.includes(vals[info.id]) &&
            !td[tray.name] &&
            tray.prereq(gs)
          if (valid) {
            setPlaced(p => ({ ...p, [info.id]: { x: tray.x, y: tray.y } }))
            setTrayDice(prev => ({ ...prev, [tray.name]: info.id }))
            tray.onSnap(dispatch, gs, vals[info.id])
          } else {
            setPlaced(p => { const next = { ...p }; delete next[info.id]; return next })
          }
          snapped = true
          break
        }
      }

      if (!snapped) setPlaced(p => { const next = { ...p }; delete next[info.id]; return next })
    } else {
      // Released off the board → return the die to its tray.
      setPlaced(p => {
        const next = { ...p }
        delete next[info.id]
        return next
      })
    }
  }

  const [dieTriggers, setDieTriggers] = useState(() => Object.fromEntries(ALL_DICE.map(d => [d.id, 0])))
  const [rolledThisAlt, setRolledThisAlt] = useState(new Set())
  const [rerollUsed, setRerollUsed] = useState(new Set())
  const [rerollGranted, setRerollGranted] = useState(false)
  const [turnResult, setTurnResult] = useState(null)
  const [coffeeChoice, setCoffeeChoice] = useState(null) // { tokenIndex } when pending
  const [coffeeTriggers, setCoffeeTriggers] = useState({})
  const DEST_W = 197; const DEST_H = 151
  const BLANK_W = 197; const BLANK_H = 99
  const PANEL_GAP = 11
  const PANEL_GAP_COLOR = '#91aaae'
  const APPROACH_START = { x: 126, y: -243 }
  const [approachPos, setApproachPos] = useState(APPROACH_START)
  const approachLocked = gameState.gameReady === 1
  const setupPhase = gameState.gameReady === 0
  const allDicePlaced = !setupPhase && byColor('blue').length === 0 && byColor('orange').length === 0

  // ── Multiplayer (Firebase) ─────────────────────────────────────────────────
  const clientIdRef = useRef((() => {
    let id = localStorage.getItem('skyteam-clientId')
    if (!id) { id = Math.random().toString(36).slice(2, 10); localStorage.setItem('skyteam-clientId', id) }
    return id
  })())
  const { connected, peers } = useFirebaseSync(clientIdRef.current)

  // Player 1 = earliest joinedAt in presence list
  const isFirstPlayer = peers.length === 0 || peers[0]?.clientId === clientIdRef.current
  // The approach track is set up by a single editor (Player 1) during setup, so
  // the two clients can't fight over it and both stay in sync. Player 2's
  // controls are hidden; the strip itself (panels/planes) still renders for both.
  const canEditApproach = !approachLocked && isFirstPlayer

  const [myRole, setMyRole] = useState(null)
  const myRoleRef = useRef(null)
  myRoleRef.current = myRole
  const [roles, setRoles] = useState({})
  const skipSync = useRef({})

  // One SSE stream for the whole /game node — NOT one per key.
  // The RTDB endpoint is HTTP/1.1, so the browser caps connections at 6 per
  // host. Six game-state EventSources saturated that pool, and every PUT write
  // and presence poll then queued behind them forever (confirmed: an in-page
  // fetch to the DB hung indefinitely). A single stream, demuxed by the event's
  // `path` field, leaves connection slots free for reads and writes.
  useEffect(() => {
    const DB = 'https://guysky-95670-default-rtdb.asia-southeast1.firebasedatabase.app'
    const cid = clientIdRef.current

    // Apply one top-level key of /game to local state.
    const applyKey = (key, val) => {
      if (key === 'gameState') {
        if (!val || val._by === cid) return
        skipSync.current.gameState = true
        dispatch({ type: 'SYNC_STATE', state: val })
      } else if (key === 'values') {
        if (!val || val._by === cid) return
        skipSync.current.values = true
        const { _by, ...rest } = val
        const myColor = myRoleRef.current
        if (!myColor) { setValues(rest); return }
        // Both pilots roll simultaneously each round, so two values pushes cross.
        // Keep my own dice from local state, take only the peer's dice from the
        // incoming snapshot — otherwise a peer's push reverts my fresh roll.
        setValues(prev => {
          const merged = { ...prev }
          for (const [id, v] of Object.entries(rest)) if (!id.startsWith(myColor)) merged[id] = v
          return merged
        })
      } else if (key === 'trayDice') {
        if (!val || val._by === cid) return
        skipSync.current.trayDice = true
        const { _by, ...rest } = val
        // Firebase strips null values, so empty trays come back missing. Rebuild
        // the full key set (null = empty) or occupancy checks break.
        const blank = Object.fromEntries(TRAYS.map(t => [t.name, null]))
        const myColor = myRoleRef.current
        if (!myColor) { setTrayDice({ ...blank, ...rest }); return }
        // Both clients edit the shared board, but each only ever places its own
        // colour's dice. Merge by occupant ownership — keep my-colour entries
        // from local state, take the peer's colour from the incoming snapshot —
        // so the peer's snapshot (which lacks my dice) can't wipe my placements.
        setTrayDice(prev => {
          const merged = { ...blank }
          for (const [t, id] of Object.entries(prev)) if (id && id.startsWith(myColor)) merged[t] = id
          for (const [t, id] of Object.entries(rest)) if (id && !id.startsWith(myColor)) merged[t] = id
          return merged
        })
      } else if (key === 'placed') {
        if (!val || val._by === cid) return
        skipSync.current.placed = true
        const { _by, ...rest } = val
        const myColor = myRoleRef.current
        if (!myColor) { setPlaced(rest); return }
        setPlaced(prev => {
          const merged = {}
          for (const [id, pos] of Object.entries(prev)) if (id.startsWith(myColor)) merged[id] = pos
          for (const [id, pos] of Object.entries(rest)) if (!id.startsWith(myColor)) merged[id] = pos
          return merged
        })
      } else if (key === 'roles') {
        if (!val) return
        setRoles(val)
        if (val.blue === cid) setMyRole('blue')
        else if (val.orange === cid) setMyRole('orange')
      } else if (key === 'rerollGranted') {
        if (val && val !== cid) setRerollGranted(true)
      } else if (key === 'approachPos') {
        if (!val || val._by === cid) return
        skipSync.current.approachPos = true
        const { _by, ...rest } = val
        setApproachPos(rest)
      } else if (key === 'axisAngle') {
        // The plane bank is a shared board element. It's set both by manual
        // rotation and by the end-turn dice computation; keep both clients in
        // sync so the displayed tilt matches the authoritative value.
        if (!val || val._by === cid) return
        skipSync.current.axisAngle = true
        setAxisAngle(val.v)
      }
      // 'presence' is intentionally ignored — owned by useFirebaseSync polling.
    }

    const GAME_KEYS = ['gameState', 'values', 'trayDice', 'placed', 'roles', 'rerollGranted', 'approachPos', 'axisAngle']

    // Firebase SSE payloads are { path, data }. path '/' is a full snapshot of
    // /game; '/gameState' is a single top-level key; '/presence/<id>' is nested.
    const handle = (e) => {
      try {
        const { path, data } = JSON.parse(e.data)
        if (path === '/') {
          if (!data) return
          for (const k of GAME_KEYS) if (data[k] !== undefined) applyKey(k, data[k])
        } else {
          const seg = path.split('/').filter(Boolean)
          if (seg.length === 1) applyKey(seg[0], data) // deeper paths (presence) ignored
        }
      } catch {}
    }

    const es = new EventSource(`${DB}/game.json?alt=sse`)
    es.addEventListener('put', handle)
    es.addEventListener('patch', handle)

    return () => es.close()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fbWrite = (subpath, value) => {
    const DB = 'https://guysky-95670-default-rtdb.asia-southeast1.firebasedatabase.app'
    fetch(`${DB}/game${subpath}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    }).catch(() => {})
  }

  // Push gameState → Firebase
  useEffect(() => {
    if (skipSync.current.gameState) { skipSync.current.gameState = false; return }
    fbWrite('/gameState', { ...gameState, _by: clientIdRef.current })
  }, [gameState]) // eslint-disable-line react-hooks/exhaustive-deps

  // Push values → Firebase
  useEffect(() => {
    if (skipSync.current.values) { skipSync.current.values = false; return }
    fbWrite('/values', { ...values, _by: clientIdRef.current })
  }, [values]) // eslint-disable-line react-hooks/exhaustive-deps

  // Push trayDice → Firebase
  useEffect(() => {
    if (skipSync.current.trayDice) { skipSync.current.trayDice = false; return }
    fbWrite('/trayDice', { ...trayDice, _by: clientIdRef.current })
  }, [trayDice]) // eslint-disable-line react-hooks/exhaustive-deps

  // Push placed → Firebase
  useEffect(() => {
    if (skipSync.current.placed) { skipSync.current.placed = false; return }
    fbWrite('/placed', { ...placed, _by: clientIdRef.current })
  }, [placed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Push approachPos → Firebase (vertical position of the approach strip, so
  // both clients render it identically — panel data already rides in gameState)
  useEffect(() => {
    if (skipSync.current.approachPos) { skipSync.current.approachPos = false; return }
    fbWrite('/approachPos', { ...approachPos, _by: clientIdRef.current })
  }, [approachPos]) // eslint-disable-line react-hooks/exhaustive-deps

  // Push axisAngle → Firebase (shared plane bank; see apply handler above)
  useEffect(() => {
    if (skipSync.current.axisAngle) { skipSync.current.axisAngle = false; return }
    fbWrite('/axisAngle', { v: axisAngle, _by: clientIdRef.current })
  }, [axisAngle]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset local turn state when turnCount advances (both clients)
  const prevTurnCount = useRef(gameState.turnCount)
  useEffect(() => {
    if (gameState.turnCount === prevTurnCount.current) return
    prevTurnCount.current = gameState.turnCount
    setRolledThisAlt(new Set())
    setRerollUsed(new Set())
    setRerollGranted(false)
    setDieTriggers(Object.fromEntries(ALL_DICE.map(d => [d.id, 0])))
    // End-of-turn board clear is driven by turnCount (not the placed/trayDice
    // sync) because the ownership-merge intentionally ignores a peer's empty
    // snapshot. Both clients clear their board here when the turn advances.
    setPlaced({})
    setTrayDice(Object.fromEntries(TRAYS.map(t => [t.name, null])))
  }, [gameState.turnCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Flip activePlayer when this client's dice are all placed but not all 8 yet
  useEffect(() => {
    if (setupPhase || !myRole || gameState.gameOver || gameState.gameWin) return
    if (gameState.activePlayer !== myRole) return
    const myColorDone = byColor(myRole).length === 0
    const allDone = byColor('blue').length === 0 && byColor('orange').length === 0
    if (myColorDone && !allDone) {
      const other = myRole === 'blue' ? 'orange' : 'blue'
      dispatch({ type: 'SET_ACTIVE_PLAYER', value: other })
    }
  }, [placed, trayDice]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto end turn when all 8 dice placed — only Captain (or solo) fires it
  const endTurnFiredRef = useRef(false)
  useEffect(() => { endTurnFiredRef.current = false }, [gameState.turnCount])
  useEffect(() => {
    if (!allDicePlaced || setupPhase || gameState.gameOver || gameState.gameWin) return
    if (endTurnFiredRef.current) return
    if (myRole !== null && myRole !== 'blue') return
    endTurnFiredRef.current = true
    handleEndTurn()
  }, [allDicePlaced]) // eslint-disable-line react-hooks/exhaustive-deps

  // A role is only really taken if its holder is currently connected (or me).
  // Stale /roles entries (from a previous session, keyed by a now-disconnected
  // clientId) must be treated as free, or a fresh Player 1 sees both colours
  // "taken" and can't pick anything.
  const livePeerIds = new Set(peers.map(p => p.clientId))
  const roleTaken = (color) =>
    !!roles[color] &&
    (roles[color] === clientIdRef.current || livePeerIds.has(roles[color]))

  const claimRole = (color) => {
    if (roleTaken(color)) return
    const next = { ...roles, [color]: clientIdRef.current }
    fbWrite('/roles', next)
    setMyRole(color)
    setRoles(next)
  }

  // Player 2 doesn't pick — it auto-claims whichever colour Player 1 left open,
  // so role assignment is fully Player-1-controlled.
  useEffect(() => {
    if (isFirstPlayer || myRole) return
    if (peers.length < 2) return
    const taken = roleTaken('blue') ? 'blue' : roleTaken('orange') ? 'orange' : null
    if (!taken) return
    const other = taken === 'blue' ? 'orange' : 'blue'
    if (!roleTaken(other)) claimRole(other)
  }, [isFirstPlayer, myRole, roles, peers]) // eslint-disable-line react-hooks/exhaustive-deps

  const isMyTurn = myRole === null || gameState.activePlayer === myRole
  // ── End Multiplayer ────────────────────────────────────────────────────────
  const [savedStrips, setSavedStrips] = useState(() => {
    try { return JSON.parse(localStorage.getItem('approachStrips') || '[]') } catch { return [] }
  })
  const [loadSelection, setLoadSelection] = useState('')
  const saveStrip = () => {
    const strip = {
      name: gameState.approachHeader || 'Unnamed',
      panels: gameState.approachPanels.map(p => ({ planeSlots: p.planeSlots })),
      posY: approachPos.y,
      savedAt: Date.now(),
    }
    setSavedStrips(prev => {
      const next = [...prev, strip].slice(-5)
      localStorage.setItem('approachStrips', JSON.stringify(next))
      return next
    })
  }
  const loadStrip = () => {
    const idx = parseInt(loadSelection)
    if (isNaN(idx) || !savedStrips[idx]) return
    dispatch({ type: 'LOAD_APPROACH_STRIP', strip: savedStrips[idx] })
    setApproachLocked(false)
  }

  const ALT_STRIP_Y_BY_VALUE = { 6: 7, 5: 117, 4: 227, 3: 337, 2: 447, 1: 559, 0: 632 }
  const altStrip = { x: ALT_STRIP_X, y: ALT_STRIP_Y_BY_VALUE[gameState.altitude] ?? 7, w: ALT_STRIP_W, h: ALT_STRIP_H }


  const handleRollAll = (filterColor) => {
    setTurnResult(null)
    setDieTriggers(prev => {
      const next = { ...prev }
      ALL_DICE.forEach(d => {
        if (filterColor && d.color !== filterColor) return
        const inTray = !trayDice || Object.values(trayDice).every(v => v !== d.id)
        if (!inTray) return // die is placed on board, skip
        const canRoll = !rolledThisAlt.has(d.id) || (rerollGranted && !rerollUsed.has(d.id))
        if (canRoll) next[d.id] = (prev[d.id] || 0) + 1
      })
      return next
    })
  }

  const handleReset = () => {
    dispatch({ type: 'RESET' })
    setPlaced({})
    setTrayDice(Object.fromEntries(TRAYS.map(t => [t.name, null])))
    setValues(Object.fromEntries(ALL_DICE.map(d => [d.id, d.value])))
    setAxisAngle(0)
    setDieTriggers(Object.fromEntries(ALL_DICE.map(d => [d.id, 0])))
    setRolledThisAlt(new Set())
    setRerollUsed(new Set())
    setRerollGranted(false)
    setTurnResult(null)

    setApproachPos(APPROACH_START)
  }

  const handleEndTurn = () => {
    const gs = gameState
    const issues = []

    // Engine check (both engine dice must be placed; `!= null` also rejects an
    // undefined key, e.g. a tray map that lost its nulls through Firebase)
    const blueEngDieId = trayDice['eng-blue']
    const orangeEngDieId = trayDice['eng-orange']
    const engineCheckPassed = blueEngDieId != null && orangeEngDieId != null
    let approachDistance = null
    if (engineCheckPassed) {
      const engineValue = values[blueEngDieId] + values[orangeEngDieId]
      const blueThreshold = BLUE_ENGINE_VALUES[gs.blueEngine]
      const orangeThreshold = ORANGE_ENGINE_VALUES[gs.orangeEngine]
      if (engineValue < blueThreshold) approachDistance = 0
      else if (engineValue > orangeThreshold) approachDistance = 2
      else approachDistance = 1
    }

    // Axis check
    const axisBlueDieId = trayDice['axis-blue']
    const axisOrangeDieId = trayDice['axis-orange']
    let axisCheckPassed = false
    let computedAxisPos = null
    if (!axisBlueDieId || !axisOrangeDieId) {
    } else {
      const currentIdx = AXIS_SNAP_ANGLES.reduce((best, a, i) =>
        Math.abs(a - axisAngle) < Math.abs(AXIS_SNAP_ANGLES[best] - axisAngle) ? i : best, 0)
      const currentPos = currentIdx - 3
      const blueAxisVal = values[axisBlueDieId]
      const orangeAxisVal = values[axisOrangeDieId]
      const rawPos = currentPos + orangeAxisVal - blueAxisVal
      const newPos = Math.max(-3, Math.min(3, rawPos))
      computedAxisPos = newPos
      setAxisAngle(AXIS_SNAP_ANGLES[newPos + 3])
      if (newPos === -3 || newPos === 3) {
      } else {
        axisCheckPassed = true
      }
    }

    // Game over if either check fails (only once game is in play)
    if (gs.gameReady === 1 && (!engineCheckPassed || !axisCheckPassed)) {
      dispatch({ type: 'SET_GAME_OVER', value: true })
      return
    }

    let endgameResult = null // computed now, dispatched after all other processing

    if (engineCheckPassed && axisCheckPassed && gs.altitude > 0) {
      // Altitude decrement first
      const newAltitude = gs.altitude - 1
      dispatch({ type: 'SET_ALTITUDE', value: newAltitude })
      setRolledThisAlt(new Set())
      setRerollUsed(new Set())
      setRerollGranted(false)
      if (newAltitude === 2 && !gs.rerollToken) {
        dispatch({ type: 'SET_REROLL_TOKEN', value: true })
      }

      // Advance approach strip + panel distance checks
      if (approachDistance !== null && gs.approachDistance > 0) {
        dispatch({ type: 'ADVANCE_APPROACH', value: approachDistance })
      }
      if (approachDistance > 0) {
        const destD = gs.approachPanels[0].d
        if (gs.gameReady === 1 && destD != null && destD - approachDistance < 0) {
          dispatch({ type: 'SET_GAME_OVER', value: true })
        } else {
          setApproachPos(p => ({ ...p, y: p.y + approachDistance * (BLANK_H + PANEL_GAP) }))
          if (gs.gameReady === 1) {
            const planeCollision = gs.approachPanels.some(
              p => p.d != null && p.d - approachDistance <= 0 && p.planes > 0
            )
            if (planeCollision) {
              dispatch({ type: 'SET_GAME_OVER', value: true })
            } else {
              dispatch({ type: 'DECREMENT_PANEL_D', amount: approachDistance })
            }
          }
        }
      }
    }

    // Endgame check — runs when End Turn is pressed while already at altitude 0
    if (engineCheckPassed && axisCheckPassed && gs.altitude === 0 && gs.gameReady === 1) {
      endgameResult = computeLandingResult({
        destD: gs.approachPanels[0].d ?? 0,
        planes: gs.approachPanels[0].planes,
        flaps: gs.flaps,
        landingGear: gs.landingGear,
        axisPos: computedAxisPos,
        engSum: (blueEngDieId != null ? values[blueEngDieId] : 0) + (orangeEngDieId != null ? values[orangeEngDieId] : 0),
        brakeVal: BRAKE_MARKER_POS[gs.brakeMarker]?.value ?? 0,
      })
    }

    // Return all dice to trays
    setPlaced({})
    setTrayDice(Object.fromEntries(TRAYS.map(t => [t.name, null])))

    setTurnResult(issues.length === 0 ? 'Turn OK ✓' : issues.join(' · '))

    // Altitude-0 endgame — dispatched last so all other state updates go through first
    if (endgameResult === 'win') dispatch({ type: 'SET_GAME_WIN', value: true })
    else if (endgameResult === 'over') dispatch({ type: 'SET_GAME_OVER', value: true })

    // Advance turn counter so both clients reset their local turn state
    dispatch({ type: 'INCREMENT_TURN' })

    // Reset activePlayer for next turn based on altitude (which was just decremented)
    const nextAlt = gs.altitude - 1
    if (nextAlt > 0) {
      const nextActive = nextAlt % 2 === 0 ? 'blue' : 'orange'
      dispatch({ type: 'SET_ACTIVE_PLAYER', value: nextActive })
    }
  }

  // A die (in tray or on board) is hidden only once a real drag is underway.
  const isHidden = (id) => drag && drag.moved && drag.id === id
  const placedRatio = SQUARE / NATIVE
  const btnStyle = { padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 'bold', background: '#2980b9', color: '#fff', fontSize: 14 }

  return (
    <div>
      {/* Player identity bar — always visible at the top */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #333', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'sans-serif' }}>
        {/* Player number — based on awareness join order */}
        <div style={{ fontSize: 16, fontWeight: 'bold', color: isFirstPlayer ? '#f1c40f' : '#aaa', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#27ae60', display: 'inline-block', flexShrink: 0 }} />
          {peers.length <= 1 ? 'Player 1' : isFirstPlayer ? 'Player 1' : 'Player 2'}
        </div>

        {/* Role selection or role label */}
        {myRole !== null ? (
          <div style={{ fontSize: 15, fontWeight: 'bold', color: myRole === 'blue' ? '#4a9eff' : '#ff8c42' }}>
            ✈ {myRole === 'blue' ? 'Captain (Blue)' : 'Co-Captain (Orange)'}
          </div>
        ) : isFirstPlayer ? (
          /* Player 1 picks a colour; Player 2 auto-takes the other (effect below) */
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => claimRole('blue')}
              disabled={roleTaken('blue')}
              style={{ padding: '6px 18px', fontSize: 14, fontWeight: 'bold', background: roleTaken('blue') ? '#333' : '#1a5fa8', color: '#fff', border: 'none', borderRadius: 6, cursor: roleTaken('blue') ? 'not-allowed' : 'pointer', opacity: roleTaken('blue') ? 0.5 : 1 }}
            >
              {roleTaken('blue') ? 'Captain taken' : 'Captain (Blue)'}
            </button>
            <button
              onClick={() => claimRole('orange')}
              disabled={roleTaken('orange')}
              style={{ padding: '6px 18px', fontSize: 14, fontWeight: 'bold', background: roleTaken('orange') ? '#333' : '#b84a00', color: '#fff', border: 'none', borderRadius: 6, cursor: roleTaken('orange') ? 'not-allowed' : 'pointer', opacity: roleTaken('orange') ? 0.5 : 1 }}
            >
              {roleTaken('orange') ? 'Co-Captain taken' : 'Co-Captain (Orange)'}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#888', fontWeight: 'bold' }}>
            Waiting for Player 1 to choose roles…
          </div>
        )}

        {/* Current turn (during play) / connection status */}
        <div style={{ fontSize: 12, color: '#666', minWidth: 150, textAlign: 'right' }}>
          {(gameState.gameReady === 1 && !gameState.gameOver && !gameState.gameWin)
            ? <span style={{ color: gameState.activePlayer === 'blue' ? '#4a9eff' : '#ff8c42', fontWeight: 'bold' }}>
                ✈ Turn: {gameState.activePlayer === 'blue' ? 'Captain (Blue)' : 'Co-Captain (Orange)'}{isMyTurn ? ' — You' : ''}
              </span>
            : !(roleTaken('blue') && roleTaken('orange'))
              ? 'Waiting for 2nd player…'
              : <span style={{ color: '#27ae60' }}>● Both players connected</span>}
        </div>
      </div>

      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Altitude strip — draggable + resizable */}
        <div style={{ width: BOARD_W * scale, height: altStrip.h * scale, flexShrink: 0 }}>
          <div style={{
            position: 'relative',
            width: BOARD_W,
            height: altStrip.h,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}>
            <img
              src={altitudeStripImg}
              draggable={false}
              style={{
                position: 'absolute',
                left: Math.round(altStrip.x),
                top: Math.round(altStrip.y),
                width: Math.round(altStrip.w),
                height: Math.round(altStrip.h),
                userSelect: 'none',
              }}
            />
          </div>
        </div>

        {/* Reserves the scaled footprint so the page lays out correctly */}
        <div style={{
          width: BOARD_W * scale,
          height: BOARD_H * scale
        }}>
          {/* Fixed canvas — all board coordinates are relative to this. */}
          <div
            ref={canvasRef}
            style={{
              position: 'relative',
              width: BOARD_W,
              height: BOARD_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
          >
            <img
              src={background}
              width={BOARD_W}
              draggable={false}
              style={{ display: 'block', userSelect: 'none' }}
            />

            {/* Approach strip panels — overlaid on the board */}
            {(() => {
              return (
                <div style={{ position: 'absolute', left: approachPos.x, top: approachPos.y, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                  {/* + and − buttons outside left edge at the panel junction */}
                  {(() => {
                    const maxDist = gameState.approachPanels.length
                    const destPlanes = gameState.approachPanels[0].planes
                    const planeBtnStyle = { width: 18, height: 16, fontSize: 11, lineHeight: 1, padding: 0, cursor: 'pointer', border: '1px solid #4a6a8a', background: '#2a4a6a', color: '#fff', fontWeight: 'bold' }
                    const slotSymbol = (count, extraTop = 0) => (
                      <div style={{ position: 'absolute', top: 3 + extraTop, bottom: 0, left: 9, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 3, pointerEvents: 'none' }}>
                        {Array.from({ length: count }).map((_, si) => (
                          <div key={si} style={{ width: 18, height: 18, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                            <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✈</span>
                          </div>
                        ))}
                      </div>
                    )
                    const ctrlBtn = { fontSize: 11, padding: '2px 6px', cursor: 'pointer', border: '1px solid #555', borderRadius: 3, fontWeight: 'bold', whiteSpace: 'nowrap' }
                    return (
                      <>
                        {/* ── right-side controls (save / load dropdown) — setup only ── */}
                        {canEditApproach && (
                          <div style={{ position: 'absolute', left: DEST_W + 6, top: 0, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 20 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); saveStrip() }}
                              style={{ ...ctrlBtn, background: '#3a5a3a', color: '#fff' }}
                            >Save</button>
                            <select
                              value={loadSelection}
                              onChange={e => { const v = e.target.value; setLoadSelection(v); if (v !== '') { const idx = parseInt(v); const s = savedStrips[idx]; if (s) { dispatch({ type: 'LOAD_APPROACH_STRIP', strip: s }); if (s.posY != null) setApproachPos(p => ({ ...p, y: s.posY })) } } }}
                              onPointerDown={e => e.stopPropagation()}
                              style={{ fontSize: 10, maxWidth: 70, background: '#1a2a3a', color: '#fff', border: '1px solid #555', borderRadius: 3 }}
                            >
                              <option value=''>Load…</option>
                              {savedStrips.map((s, i) => <option key={i} value={i}>{s.name || 'Unnamed'}</option>)}
                            </select>
                          </div>
                        )}

                        <div style={{ position: 'relative' }}>
                          <img src={destinationPanelImg} draggable={false} style={{ width: DEST_W, height: DEST_H, display: 'block', userSelect: 'none' }} />

                          <div style={{ position: 'absolute', bottom: 4, right: 6, color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace', pointerEvents: 'none', textShadow: '0 1px 3px #000' }}>{maxDist}</div>
                          {/* destination label — centered */}
                          <input
                            readOnly={!canEditApproach}
                            value={gameState.approachHeader}
                            onChange={e => canEditApproach && dispatch({ type: 'SET_APPROACH_HEADER', value: e.target.value })}
                            onPointerDown={e => e.stopPropagation()}
                            placeholder="Destination"
                            style={{ position: 'absolute', top: 12, left: 8, right: 8, width: DEST_W - 16, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontWeight: 'bold', fontSize: 17, textAlign: 'center', fontFamily: 'sans-serif', textShadow: '0 1px 3px #000', cursor: canEditApproach ? 'text' : 'default' }}
                          />
                          {/* check button — right edge, same row as input */}
                          {(() => {
                            const bothReady = roleTaken('blue') && roleTaken('orange')
                            return (
                              <button
                                onClick={(e) => { if (!bothReady) return; e.stopPropagation(); const n = gameState.approachPanels.length; dispatch({ type: 'LOCK_APPROACH_VALUES', values: gameState.approachPanels.map((p, i) => ({ d: n - i, p: p.planes })) }); dispatch({ type: 'SET_GAME_READY', value: 1 }) }}
                                onPointerDown={e => e.stopPropagation()}
                                title={bothReady ? 'Start game' : 'Waiting for both players…'}
                                style={{ position: 'absolute', top: 22, right: 4, width: 16, height: 16, padding: 0, border: 'none', borderRadius: 2, background: bothReady ? '#1a5a1a' : '#555', color: '#fff', fontSize: 11, lineHeight: 1, cursor: bothReady ? 'pointer' : 'not-allowed', display: (approachLocked || !isFirstPlayer) ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', opacity: bothReady ? 1 : 0.5 }}
                              >✓</button>
                            )
                          })()}
                          {slotSymbol(gameState.approachPanels[0].planeSlots, 40)}
                          <div style={{ position: 'absolute', top: 71, left: 0, right: 0, bottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            {Array.from({ length: destPlanes }).map((_, ti) => (
                              <img key={ti} src={planeTokenImg} draggable={false} style={{ width: 39, height: 39, userSelect: 'none' }} />
                            ))}
                          </div>
                          {canEditApproach && (
                            <div style={{ position: 'absolute', bottom: 26, right: 6, display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_APPROACH_PLANES', index: 0, value: destPlanes + 1 }) }} style={planeBtnStyle}>+</button>
                              <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_APPROACH_PLANES', index: 0, value: destPlanes - 1 }) }} style={planeBtnStyle}>−</button>
                            </div>
                          )}
                        </div>
                        {gameState.approachPanels.slice(1).map((panel, i) => {
                          const dist = maxDist - 1 - i
                          const panelIndex = i + 1
                          const planes = panel.planes
                          const btnBase = { width: 22, height: 18, fontSize: 13, lineHeight: 1, padding: 0, cursor: 'pointer', border: '1px solid #6a7fa0', background: '#5b7fa6', color: '#fff', fontWeight: 'bold', position: 'absolute', right: '100%' }
                          return (
                            <div key={i} style={{ position: 'relative' }}>
                              <div style={{ position: 'relative', zIndex: 5, height: PANEL_GAP + 12, marginTop: -6, marginBottom: -6, background: dist === 3
                                ? `linear-gradient(to bottom, ${PANEL_GAP_COLOR} 9px, #b8ccce 10px, #c2d2d0 11px, #c2d2d0 12px, #b8ccce 13px, ${PANEL_GAP_COLOR} 14px)`
                                : `linear-gradient(to bottom, ${PANEL_GAP_COLOR} 10px, #b8ccce 10px, #b8ccce 11px, #c2d2d0 11px, #c2d2d0 12px, #b8ccce 12px, #b8ccce 13px, ${PANEL_GAP_COLOR} 13px)` }} />
                              {canEditApproach && <>
                                <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'ADD_APPROACH_PANEL' }); setApproachPos(p => ({ ...p, y: p.y - BLANK_H - PANEL_GAP })) }} style={{ ...btnBase, top: -18, borderRadius: '3px 0 0 0' }}>+</button>
                                <button onClick={(e) => { e.stopPropagation(); if (gameState.approachPanels.length > 2) { dispatch({ type: 'REMOVE_APPROACH_PANEL' }); setApproachPos(p => ({ ...p, y: p.y + BLANK_H + PANEL_GAP })) } }} style={{ ...btnBase, top: 0, borderRadius: '0 0 0 3px', borderTop: 'none' }}>−</button>
                              </>}
                              <img src={blankPanelImg} draggable={false} style={{ width: BLANK_W, height: BLANK_H, display: 'block', userSelect: 'none' }} />
                              {slotSymbol(panel.planeSlots)}
                              <div style={{ position: 'absolute', top: 33, left: 0, right: 0, bottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                {Array.from({ length: planes }).map((_, ti) => (
                                  <img key={ti} src={planeTokenImg} draggable={false} style={{ width: 39, height: 39, userSelect: 'none' }} />
                                ))}
                              </div>
                              {canEditApproach && (
                                <div style={{ position: 'absolute', bottom: 22, right: 6, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_APPROACH_PLANES', index: panelIndex, value: planes + 1 }) }} style={planeBtnStyle}>+</button>
                                  <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_APPROACH_PLANES', index: panelIndex, value: planes - 1 }) }} style={planeBtnStyle}>−</button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </>
                    )
                  })()}
                </div>
              )
            })()}

            {/* Landing Gear switches — left column, 3 switches */}
            {LANDING_GEAR_POS.map((pos, i) => (
              <Switch
                key={`lg-${i}`}
                on={gameState.landingGear[i]}
                x={pos.x} y={pos.y} width={SW_W} height={SW_H}
              />
            ))}

            {/* Flap switches — right column, 4 switches */}
            {FLAP_POS.map((pos, i) => (
              <Switch
                key={`flap-${i}`}
                on={gameState.flaps[i]}
                x={pos.x} y={pos.y} width={SW_W} height={SW_H}
              />
            ))}

            {/* Brake switches — bottom center, 3 switches */}
            {BRAKE_POS.map((pos, i) => (
              <Switch
                key={`brake-${i}`}
                on={gameState.brakes[i]}
                x={pos.x} y={pos.y} width={SW_W} height={SW_H}
              />
            ))}

            {/* Brake marker — display only */}
            {BRAKE_MARKER_POS.map((slot, i) => (
              <div
                key={`bm-${i}`}
                style={{ position: 'absolute', left: slot.x, top: slot.y, width: slot.w, height: slot.h }}
              >
                {gameState.brakeMarker === i && (
                  <img src={slot.img} draggable={false} style={{ width: '100%', height: '100%', userSelect: 'none' }} />
                )}
              </div>
            ))}

            {/* Blue engine marker — display only */}
            {BLUE_ENGINE_POS.map((slot, i) => (
              <div
                key={`be-${i}`}
                style={{ position: 'absolute', left: slot.x, top: slot.y, width: slot.w, height: slot.h }}
              >
                {gameState.blueEngine === i && (
                  <img src={slot.img} draggable={false} style={{ width: '100%', height: '100%', userSelect: 'none' }} />
                )}
              </div>
            ))}

            {/* Orange engine marker — display only */}
            {ORANGE_ENGINE_POS.map((slot, i) => (
              <div
                key={`oe-${i}`}
                style={{ position: 'absolute', left: slot.x, top: slot.y, width: slot.w, height: slot.h }}
              >
                {gameState.orangeEngine === i && (
                  <img src={slot.img} draggable={false} style={{ width: '100%', height: '100%', userSelect: 'none' }} />
                )}
              </div>
            ))}

            {/* Coffee tokens — spend by clicking an ON token */}
            {COFFEE_POS.map((pos, i) => (
              <div
                key={`coffee-${i}`}
                onClick={() => { if (!setupPhase && gameState.coffeeTokens[i]) setCoffeeChoice({ tokenIndex: i }) }}
                style={{
                  position: 'absolute', left: pos.x, top: pos.y,
                  width: COFFEE_W, height: COFFEE_H,
                  cursor: gameState.coffeeTokens[i] ? 'pointer' : 'default',
                }}
              >
                {gameState.coffeeTokens[i] && (
                  <img src={coffeeToken} draggable={false} style={{ width: '100%', height: '100%', userSelect: 'none' }} />
                )}
              </div>
            ))}

            {/* Reroll token — top-left area. Click to toggle used/available. */}
            <img
              src={rerollImg}
              draggable={false}
              onClick={() => {
                if (!setupPhase && gameState.rerollToken) {
                  dispatch({ type: 'SET_REROLL_TOKEN', value: false })
                  setRerollGranted(true)
                  // Notify remote client to also grant reroll
                  fbWrite('/rerollGranted', clientIdRef.current)
                }
              }}
              style={{
                position: 'absolute',
                left: Math.round(px(23)) + 4,
                top: Math.round(px(28)),
                width: Math.round(px(87)),
                height: Math.round(px(102)),
                opacity: gameState.rerollToken ? 1 : 0,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            />

            {/* Axis plane. Center pixel (126,128) is pinned to the compass
                middlepoint (384,317); rotating uses that same pixel as the
                transform origin, so it always pivots around the compass center.
                Display-only — banking is driven by the arc handle below. */}
            <img
              src={plane90}
              draggable={false}
              style={{
                position: 'absolute',
                left: px(COMPASS_CX - PLANE90.cx),
                top: px(COMPASS_CY - PLANE90.cy),
                width: px(PLANE90.w),
                height: px(PLANE90.h),
                transform: `rotate(${axisAngle}deg)`,
                transformOrigin: `${(PLANE90.cx / PLANE90.w) * 100}% ${(PLANE90.cy / PLANE90.h) * 100}%`,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />

            {/* Rotation handle on the top compass arc. Drag it left/right to
                bank the plane (±90°). Sits at radius AXIS_ARC_R from the center
                at the current bank angle. */}
            {(() => {
              const a = (axisAngle * Math.PI) / 180
              const hx = COMPASS_CX + AXIS_ARC_R * Math.sin(a)
              const hy = COMPASS_CY - AXIS_ARC_R * Math.cos(a)
              // Keep the bottom edge where the old circle's bottom was (hy + W/2),
              // grow upward to the taller height.
              const nLeft = hx - AXIS_HANDLE_W / 2
              const nTop = hy + AXIS_HANDLE_W / 2 - AXIS_HANDLE_H
              return (
                <div
                  onPointerDown={startAxisRotate}
                  style={{
                    position: 'absolute',
                    left: px(nLeft),
                    top: px(nTop),
                    width: px(AXIS_HANDLE_W),
                    height: px(AXIS_HANDLE_H),
                    background: 'transparent', // invisible hit area
                    cursor: 'grab',
                    touchAction: 'none',
                    userSelect: 'none',
                  }}
                />
              )
            })()}

            {gameState.altitude === 2 && <img src={altitude2000Img} draggable={false} style={{ position:'absolute', left:390, top:28, width:196, height:101, userSelect:'none', zIndex:20 }} />}

            {/* Altitude level overlays — shown only when gameState.altitude matches */}
            {gameState.altitude === 5 && <img src={altitude5000Img} draggable={false} style={{ position:'absolute', left:388, top:28, width:198, height:94, userSelect:'none', zIndex:20 }} />}
            {gameState.altitude === 4 && <img src={altitude4000Img} draggable={false} style={{ position:'absolute', left:388, top:28, width:197, height:98, userSelect:'none', zIndex:20 }} />}
            {gameState.altitude === 3 && <img src={altitude3000Img} draggable={false} style={{ position:'absolute', left:387, top:29, width:196, height:100, userSelect:'none', zIndex:20 }} />}
            {gameState.altitude === 1 && <img src={altitude1000Img} draggable={false} style={{ position:'absolute', left:388, top:26, width:197, height:103, userSelect:'none', zIndex:20 }} />}
            {gameState.altitude === 0 && <img src={altitude0Img}    draggable={false} style={{ position:'absolute', left:390, top:28, width:196, height:103, userSelect:'none', zIndex:20 }} />}

            {/* Dice placed on the board. Press-drag to reposition; release off
                the board to return to the tray. Sized to a board square. */}
            {ALL_DICE.filter(d => placed[d.id]).map(d => {
              const pos = placed[d.id]
              return (
                <div
                  key={d.id}
                  draggable={false}
                  onPointerDown={(e) => startDrag(e, d)}
                  style={{
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                    width: SQUARE,
                    height: SQUARE,
                    cursor: 'grab',
                    touchAction: 'none',
                    userSelect: 'none',
                    visibility: isHidden(d.id) ? 'hidden' : 'visible'
                  }}
                >
                  <div style={{ transform: `scale(${placedRatio})`, transformOrigin: 'top left' }}>
                    <Die color={d.color} value={values[d.id]} onRoll={(v) => handleRoll(d.id, v)} rollable={false} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Blue dice tray — shown to Captain or solo player */}
      {(myRole === null || myRole === 'blue') && (
        <DiceTray
          color="blue"
          dice={byColor('blue')}
          dieSize={SQUARE * scale}
          onPointerDown={isMyTurn ? startDrag : undefined}
          onRoll={!setupPhase ? handleRoll : undefined}
          draggingId={drag && drag.moved ? drag.id : null}
          rollTriggers={dieTriggers}
          coffeeTriggers={coffeeTriggers}
          coffeeHighlight={myRole !== 'orange' && !!coffeeChoice && !coffeeChoice.dieId}
          onCoffeeSelect={(myRole !== 'orange' && !setupPhase) ? (e, d) => setCoffeeChoice({ tokenIndex: coffeeChoice.tokenIndex, dieId: d.id, popupX: e.clientX, popupY: e.clientY }) : undefined}
          unrolledHighlight={!setupPhase ? (id) => !rolledThisAlt.has(id) : undefined}
          rerollHighlight={!setupPhase ? (id) => rerollGranted && !rerollUsed.has(id) && rolledThisAlt.has(id) : undefined}
          canRoll={setupPhase ? () => false : canRollDie}
          onRollAll={() => handleRollAll('blue')}
          rollAllDisabled={setupPhase}
        />
      )}

      {/* Orange dice tray — shown to Co-Captain or solo player */}
      {(myRole === null || myRole === 'orange') && (
        <DiceTray
          color="orange"
          dice={byColor('orange')}
          dieSize={SQUARE * scale}
          onPointerDown={isMyTurn ? startDrag : undefined}
          onRoll={!setupPhase ? handleRoll : undefined}
          draggingId={drag && drag.moved ? drag.id : null}
          rollTriggers={dieTriggers}
          coffeeTriggers={coffeeTriggers}
          coffeeHighlight={myRole !== 'blue' && !!coffeeChoice && !coffeeChoice.dieId}
          onCoffeeSelect={(myRole !== 'blue' && !setupPhase) ? (e, d) => setCoffeeChoice({ tokenIndex: coffeeChoice.tokenIndex, dieId: d.id, popupX: e.clientX, popupY: e.clientY }) : undefined}
          unrolledHighlight={!setupPhase ? (id) => !rolledThisAlt.has(id) : undefined}
          rerollHighlight={!setupPhase ? (id) => rerollGranted && !rerollUsed.has(id) && rolledThisAlt.has(id) : undefined}
          canRoll={setupPhase ? () => false : canRollDie}
          onRollAll={() => handleRollAll('orange')}
          rollAllDisabled={setupPhase}
        />
      )}

      {/* Reset button — only for first player */}
      {isFirstPlayer && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <button
            onClick={handleReset}
            style={{
              padding: '10px 18px', fontSize: 15, fontWeight: 'bold', fontFamily: 'sans-serif',
              background: '#555', color: '#fff', border: 'none', borderRadius: 8,
              cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            Reset
          </button>
        </div>
      )}



      {/* Die-value popup — shown after a highlighted die is clicked */}
      {coffeeChoice?.dieId && (() => {
        const cur = values[coffeeChoice.dieId]
        const opts = [
          ...(cur < 6 ? [cur + 1] : []),
          ...(cur > 1 ? [cur - 1] : []),
        ]
        return (
          <div
            onClick={() => setCoffeeChoice({ tokenIndex: coffeeChoice.tokenIndex })}
            style={{ position: 'fixed', inset: 0, zIndex: 2000 }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: coffeeChoice.popupX,
                top: coffeeChoice.popupY - 48,
                display: 'flex', gap: 6,
                background: '#222', borderRadius: 8, padding: '6px 10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                zIndex: 2001,
              }}
            >
              {opts.map(v => (
                <button key={v} onClick={() => {
                  const dieId = coffeeChoice.dieId
                  setValues(prev => ({ ...prev, [dieId]: v }))
                  setCoffeeTriggers(prev => ({ ...prev, [dieId]: (prev[dieId] || 0) + 1 }))
                  dispatch({ type: 'SET_COFFEE_TOKEN', index: coffeeChoice.tokenIndex, value: false })
                  setCoffeeChoice(null)
                }} style={{ ...btnStyle, fontSize: 16, padding: '4px 14px' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* The single opaque die that follows the cursor during a drag. Rendered
          in fixed/screen coordinates so it can move over board and trays alike. */}
      {gameState.gameOver && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
          <div style={{ color: '#ff2020', fontSize: 72, fontWeight: 'bold', fontFamily: 'sans-serif', textShadow: '0 4px 24px #000, 0 0 60px #ff0000', letterSpacing: 4, userSelect: 'none' }}>GAME OVER</div>
          <button onClick={handleReset} style={{ marginTop: 32, padding: '12px 40px', fontSize: 22, fontWeight: 'bold', background: '#cc2020', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>Reset</button>
        </div>
      )}

      {gameState.gameWin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
          <div style={{ color: '#27ae60', fontSize: 72, fontWeight: 'bold', fontFamily: 'sans-serif', textShadow: '0 4px 24px #000, 0 0 60px #00ff80', letterSpacing: 4, userSelect: 'none' }}>WIN</div>
          <button onClick={handleReset} style={{ marginTop: 32, padding: '12px 40px', fontSize: 22, fontWeight: 'bold', background: '#1e8449', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>Reset</button>
        </div>
      )}

      {drag && drag.moved && (
        <div
          style={{
            position: 'fixed',
            left: drag.px - drag.ox,
            top: drag.py - drag.oy,
            width: drag.size,
            height: drag.size,
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <div style={{ transform: `scale(${drag.size / NATIVE})`, transformOrigin: 'top left' }}>
            <Die color={drag.color} value={values[drag.id]} />
          </div>
        </div>
      )}
    </div>
  )
}
