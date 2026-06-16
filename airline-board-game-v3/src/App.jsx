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
import { gameReducer, initialState } from './gameState'
import './App.css'

// The board is a fixed-size canvas; everything (board art + future drop
// zones, switches, markers) lives inside it, and we scale the whole canvas
// as one unit so pixel positions stay valid on phone / iPad / PC.
// Height is derived from the real background image aspect (768x1078) so the
// canvas exactly matches the artwork and nothing overflows it.
// Bump on every deploy so you can confirm at a glance which build a tab is
// running (shown in the top bar). If two tabs show different markers, one is
// serving a stale cached bundle and needs a hard refresh.
const BUILD = 'v3-b2'
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
    onSnap: (dispatch, gs) => { if (!gs.landingGear[0]) dispatch({ type: 'TOGGLE_LANDING_GEAR', index: 0 }) },
    onUnsnap: (dispatch, gs) => { if (gs.landingGear[0]) dispatch({ type: 'TOGGLE_LANDING_GEAR', index: 0 }) } },
  { name: 'gear-1', group: 'gear', cascade: false, x: 27, y: 522, snapR: 60,
    acceptColor: 'blue',   acceptValues: [3, 4],
    prereq: ()       => true,
    onSnap: (dispatch, gs) => { if (!gs.landingGear[1]) dispatch({ type: 'TOGGLE_LANDING_GEAR', index: 1 }) },
    onUnsnap: (dispatch, gs) => { if (gs.landingGear[1]) dispatch({ type: 'TOGGLE_LANDING_GEAR', index: 1 }) } },
  { name: 'gear-2', group: 'gear', cascade: false, x: 26, y: 676, snapR: 60,
    acceptColor: 'blue',   acceptValues: [5, 6],
    prereq: ()       => true,
    onSnap: (dispatch, gs) => { if (!gs.landingGear[2]) dispatch({ type: 'TOGGLE_LANDING_GEAR', index: 2 }) },
    onUnsnap: (dispatch, gs) => { if (gs.landingGear[2]) dispatch({ type: 'TOGGLE_LANDING_GEAR', index: 2 }) } },

  // ── Brake group (3 slots above brake switches, blue dice) ──────────────────
  { name: 'brake-0', group: 'brake', x: 216, y: 715, snapR: 60,
    acceptColor: 'blue',   acceptValues: [2],
    prereq: ()       => true,
    onSnap: (dispatch, gs) => { if (!gs.brakes[0]) dispatch({ type: 'TOGGLE_BRAKE', index: 0 }) },
    onUnsnap: (dispatch, gs) => { if (gs.brakes[0]) dispatch({ type: 'TOGGLE_BRAKE', index: 0 }) } },
  { name: 'brake-1', group: 'brake', x: 323, y: 715, snapR: 60,
    acceptColor: 'blue',   acceptValues: [4],
    prereq: (gs)     => gs.brakes[0],
    onSnap: (dispatch, gs) => { if (!gs.brakes[1]) dispatch({ type: 'TOGGLE_BRAKE', index: 1 }) },
    onUnsnap: (dispatch, gs) => { if (gs.brakes[1]) dispatch({ type: 'TOGGLE_BRAKE', index: 1 }) } },
  { name: 'brake-2', group: 'brake', x: 430, y: 715, snapR: 60,
    acceptColor: 'blue',   acceptValues: [6],
    prereq: (gs)     => gs.brakes[0] && gs.brakes[1],
    onSnap: (dispatch, gs) => { if (!gs.brakes[2]) dispatch({ type: 'TOGGLE_BRAKE', index: 2 }) },
    onUnsnap: (dispatch, gs) => { if (gs.brakes[2]) dispatch({ type: 'TOGGLE_BRAKE', index: 2 }) } },

  // ── Flap group (4 slots on flap switches, orange dice) ────────────────────
  { name: 'flap-0', group: 'flap', x: 616, y: 363, snapR: 60,
    acceptColor: 'orange', acceptValues: [1, 2],
    prereq: ()       => true,
    onSnap: (dispatch, gs) => { if (!gs.flaps[0]) dispatch({ type: 'TOGGLE_FLAP', index: 0 }) },
    onUnsnap: (dispatch, gs) => { if (gs.flaps[0]) dispatch({ type: 'TOGGLE_FLAP', index: 0 }) } },
  { name: 'flap-1', group: 'flap', x: 617, y: 521, snapR: 60,
    acceptColor: 'orange', acceptValues: [2, 3],
    prereq: (gs)     => gs.flaps[0],
    onSnap: (dispatch, gs) => { if (!gs.flaps[1]) dispatch({ type: 'TOGGLE_FLAP', index: 1 }) },
    onUnsnap: (dispatch, gs) => { if (gs.flaps[1]) dispatch({ type: 'TOGGLE_FLAP', index: 1 }) } },
  { name: 'flap-2', group: 'flap', x: 617, y: 678, snapR: 60,
    acceptColor: 'orange', acceptValues: [4, 5],
    prereq: (gs)     => gs.flaps[1],
    onSnap: (dispatch, gs) => { if (!gs.flaps[2]) dispatch({ type: 'TOGGLE_FLAP', index: 2 }) },
    onUnsnap: (dispatch, gs) => { if (gs.flaps[2]) dispatch({ type: 'TOGGLE_FLAP', index: 2 }) } },
  { name: 'flap-3', group: 'flap', x: 617, y: 835, snapR: 60,
    acceptColor: 'orange', acceptValues: [5, 6],
    prereq: (gs)     => gs.flaps[2],
    onSnap: (dispatch, gs) => { if (!gs.flaps[3]) dispatch({ type: 'TOGGLE_FLAP', index: 3 }) },
    onUnsnap: (dispatch, gs) => { if (gs.flaps[3]) dispatch({ type: 'TOGGLE_FLAP', index: 3 }) } },

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
    },
    onUnsnap: (dispatch, gs, val) => {
      dispatch({ type: 'SET_RADIO2', value: null })
      dispatch({ type: 'ADD_APPROACH_PLANE', distanceValue: val })
    } },
  { name: 'radio3', group: 'radio3', cascade: false, x: 616, y: 141, snapR: 50,
    acceptColor: 'orange', acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: (dispatch, gs, val) => {
      dispatch({ type: 'SET_RADIO3', value: val })
      dispatch({ type: 'REMOVE_APPROACH_PLANE', distanceValue: val })
    },
    onUnsnap: (dispatch, gs, val) => {
      dispatch({ type: 'SET_RADIO3', value: null })
      dispatch({ type: 'ADD_APPROACH_PLANE', distanceValue: val })
    } },

  { name: 'radio1', group: 'radio1', cascade: false, x: 22, y: 141, snapR: 50,
    acceptColor: 'blue', acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: (dispatch, gs, val) => {
      dispatch({ type: 'SET_RADIO1', value: val })
      dispatch({ type: 'REMOVE_APPROACH_PLANE', distanceValue: val })
    },
    onUnsnap: (dispatch, gs, val) => {
      dispatch({ type: 'SET_RADIO1', value: null })
      dispatch({ type: 'ADD_APPROACH_PLANE', distanceValue: val })
    } },

  // ── Concentration track (3 slots, any die) — toggles coffee tokens in order ─
  // Order: upper (0) → bottom-left (1) → bottom-right (2)
  { name: 'conc-0', group: 'conc', cascade: false, x: 217, y: 891, snapR: 50,
    acceptColor: null, acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: (dispatch, gs) => {
      const next = gs.coffeeTokens.indexOf(false)
      if (next !== -1) dispatch({ type: 'SET_COFFEE_TOKEN', index: next, value: true })
    },
    onUnsnap: (dispatch, gs) => {
      const last = gs.coffeeTokens.lastIndexOf(true)
      if (last !== -1) dispatch({ type: 'SET_COFFEE_TOKEN', index: last, value: false })
    } },
  { name: 'conc-1', group: 'conc', cascade: false, x: 323, y: 891, snapR: 50,
    acceptColor: null, acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: (dispatch, gs) => {
      const next = gs.coffeeTokens.indexOf(false)
      if (next !== -1) dispatch({ type: 'SET_COFFEE_TOKEN', index: next, value: true })
    },
    onUnsnap: (dispatch, gs) => {
      const last = gs.coffeeTokens.lastIndexOf(true)
      if (last !== -1) dispatch({ type: 'SET_COFFEE_TOKEN', index: last, value: false })
    } },
  { name: 'conc-2', group: 'conc', cascade: false, x: 429, y: 891, snapR: 50,
    acceptColor: null, acceptValues: [1, 2, 3, 4, 5, 6],
    prereq: () => true,
    onSnap: (dispatch, gs) => {
      const next = gs.coffeeTokens.indexOf(false)
      if (next !== -1) dispatch({ type: 'SET_COFFEE_TOKEN', index: next, value: true })
    },
    onUnsnap: (dispatch, gs) => {
      const last = gs.coffeeTokens.lastIndexOf(true)
      if (last !== -1) dispatch({ type: 'SET_COFFEE_TOKEN', index: last, value: false })
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
  const scale = useBoardScale()   // auto-fit size = the zoom-IN cap (zoom factor 1)
  const canvasRef = useRef(null)
  const [gameState, dispatch] = useReducer(gameReducer, initialState)

  // Board-only pinch-zoom + pan (touch). `zoom` is a factor on top of the
  // auto-fit `scale`; capped at 1 (can't enlarge past the default) and floored
  // at MIN_ZOOM. `pan` translates the zoomed board within its viewport.
  const MIN_ZOOM = 0.4
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const zoomRef = useRef(1); zoomRef.current = zoom
  const panRef = useRef({ x: 0, y: 0 }); panRef.current = pan
  // Available screen height, for sizing the board viewport window (see below).
  const [availH, setAvailH] = useState(typeof window !== 'undefined' ? window.innerHeight : 800)
  useEffect(() => {
    const u = () => setAvailH(window.innerHeight)
    window.addEventListener('resize', u)
    return () => window.removeEventListener('resize', u)
  }, [])
  // Board viewport metrics (width, window height, full content height), set during
  // render and read by the pan clamp without TDZ issues.
  const viewMetricsRef = useRef({ vw: 0, vh: 0, fullH: 0 })
  const [trayDice, setTrayDice] = useState(
    () => Object.fromEntries(TRAYS.map(t => [t.name, null]))
  )
  const latestRef = useRef({})

  // Axis plane free-rotation (degrees). Grab the plane and rotate it around the
  // compass center. Not tied to discrete angles — fully manual.
  const [axisAngle, setAxisAngle] = useState(0)
  const axisDragRef = useRef(null)
  // Last axis value we've sent to OR received from Firebase. Guards the push
  // effect against echoing a received update or stranding a no-op (axisAngle is
  // a plain number, so an unchanged setState won't re-fire the effect).
  const lastAxisRef = useRef(0)

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
  latestRef.current = { brakes: gameState.brakes, flaps: gameState.flaps, landingGear: gameState.landingGear, coffeeTokens: gameState.coffeeTokens, trayDice, values, placed }
  // activePlayer mirrored into a ref so the (possibly stale) finalizeDrag closure
  // captured by a long-lived pointerup listener always reads the current turn.
  const activePlayerRef = useRef(gameState.activePlayer)
  activePlayerRef.current = gameState.activePlayer

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
    if (e.button != null && e.button !== 0) return // left / touch / pen only

    // If this die is already in a board tray, pick it up for re-dragging: free
    // the tray and reverse its side-effect (onUnsnap) so it can be moved/returned.
    // v3: a plain tap rolls the die (Die's own onClick); dragging moves it.
    const { trayDice: td } = latestRef.current
    if (TRAYS.some(t => td[t.name] === die.id)) returnDie(die.id)

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
      scale: scale * zoomRef.current, // effective on-screen board scale (fit × zoom)
      moved: false,
    }
    dragRef.current = info
    setDrag(info)

    const move = (ev) => {
      const d = dragRef.current
      if (!d) return
      ev.preventDefault?.()        // stop iOS from turning the drag into a scroll
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
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  // Whether `dieId` may snap into `tray` given the current board state. Shared by
  // drag-finalize and tap-to-place so both honour the exact same rules.
  const validateSnap = (tray, dieId, gs, td, vals) => {
    const die = ALL_DICE.find(d => d.id === dieId)
    return !!die &&
      (tray.acceptColor === null || die.color === tray.acceptColor) &&
      tray.acceptValues.includes(vals[dieId]) &&
      !td[tray.name] &&
      tray.prereq(gs)
  }

  // Commit a die into a tray (used by both drag-drop and tap-to-place): mark it
  // placed, occupy the tray, and run the side-effect (switch/token toggle).
  // v3: no turn alternation — adjudication was removed.
  const placeDie = (dieId, tray) => {
    const { brakes, flaps, landingGear, coffeeTokens, values: vals } = latestRef.current
    const gs = { brakes, flaps, landingGear, coffeeTokens }
    setPlaced(p => ({ ...p, [dieId]: { x: tray.x, y: tray.y } }))
    setTrayDice(prev => ({ ...prev, [tray.name]: dieId }))
    tray.onSnap(dispatch, gs, vals[dieId])
  }

  // Pick a placed die back up: free its tray, remove the placement, and reverse
  // the tray's side-effect via its onUnsnap handler (tap-to-return).
  const returnDie = (dieId) => {
    const { brakes, flaps, landingGear, coffeeTokens, trayDice: td, values: vals } = latestRef.current
    const gs = { brakes, flaps, landingGear, coffeeTokens }
    const tray = TRAYS.find(t => td[t.name] === dieId)
    if (!tray) return
    if (tray.onUnsnap) tray.onUnsnap(dispatch, gs, vals[dieId])
    setPlaced(p => { const next = { ...p }; delete next[dieId]; return next })
    setTrayDice(prev => ({ ...prev, [tray.name]: null }))
  }

  const finalizeDrag = (info) => {
    dragRef.current = null
    setDrag(null)
    if (!info) return
    if (!info.moved) {
      // A tap (not a drag) is a roll, handled by the Die's own onClick — no move.
      return
    }

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

      const { brakes, flaps, landingGear, coffeeTokens, trayDice: td, values: vals } = latestRef.current
      const gs = { brakes, flaps, landingGear, coffeeTokens }
      const dieCx = x + SQUARE / 2
      const dieCy = y + SQUARE / 2
      let snapped = false
      for (const tray of TRAYS) {
        const tCx = tray.x + SQUARE / 2
        const tCy = tray.y + SQUARE / 2
        if (Math.hypot(dieCx - tCx, dieCy - tCy) < tray.snapR) {
          if (validateSnap(tray, info.id, gs, td, vals)) {
            placeDie(info.id, tray)
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

  // v3: click-to-move (tap-to-select, tap-to-place, tap-to-return) removed.
  // Dice move by drag only; a click rolls them.

  // ── Board pinch-zoom + pan gesture layer ────────────────────────────────────
  const pointersRef = useRef(new Map())
  const gestureRef = useRef(null)
  const pdist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
  const clampZoom = (z) => Math.max(MIN_ZOOM, Math.min(1, z))
  const clampPan = (p, z) => {
    const { vw, vh, fullH } = viewMetricsRef.current
    const cw = vw * z, ch = fullH * z
    // When the content is smaller than the window, pin it centred; otherwise let
    // it pan within the window edges.
    const range = (content, view) => {
      if (content <= view) { const c = (view - content) / 2; return [c, c] }
      return [view - content, 0]
    }
    const [xlo, xhi] = range(cw, vw)
    const [ylo, yhi] = range(ch, vh)
    return { x: Math.max(xlo, Math.min(xhi, p.x)), y: Math.max(ylo, Math.min(yhi, p.y)) }
  }
  const onBoardPointerDown = (e) => {
    if (e.target.closest('[data-die]')) return // a die: let it handle its own drag
    // Only the bare board background drives pan/pinch — taps on switches, the
    // axis handle, tokens, approach controls, etc. must reach those controls.
    if (!e.target.closest('[data-pan]')) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
    const pts = [...pointersRef.current.values()]
    if (pointersRef.current.size >= 2) {
      gestureRef.current = {
        mode: 'pinch', startDist: pdist(pts[0], pts[1]) || 1, startZoom: zoomRef.current,
        startPan: { ...panRef.current }, vpRect: e.currentTarget.getBoundingClientRect(),
        startMid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
      }
    } else {
      gestureRef.current = { mode: 'pan', startPan: { ...panRef.current }, sx: e.clientX, sy: e.clientY }
    }
  }
  const onBoardPointerMove = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gestureRef.current
    if (!g) return
    if (g.mode === 'pinch' && pointersRef.current.size >= 2) {
      const pts = [...pointersRef.current.values()]
      const nz = clampZoom(g.startZoom * pdist(pts[0], pts[1]) / g.startDist)
      const m = { x: g.startMid.x - g.vpRect.left, y: g.startMid.y - g.vpRect.top }
      const k = nz / g.startZoom
      const np = { x: m.x - k * (m.x - g.startPan.x), y: m.y - k * (m.y - g.startPan.y) }
      setZoom(nz); setPan(clampPan(np, nz))
    } else if (g.mode === 'pan') {
      setPan(clampPan({ x: g.startPan.x + (e.clientX - g.sx), y: g.startPan.y + (e.clientY - g.sy) }, zoomRef.current))
    }
  }
  const onBoardPointerUp = (e) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size === 0) { gestureRef.current = null; return }
    if (pointersRef.current.size === 1) {
      const [pt] = [...pointersRef.current.values()]
      gestureRef.current = { mode: 'pan', startPan: { ...panRef.current }, sx: pt.x, sy: pt.y }
    }
  }
  // Re-clamp the pan whenever the fit scale or window height changes.
  useEffect(() => { setPan(p => clampPan(p, zoomRef.current)) }, [scale, availH]) // eslint-disable-line react-hooks/exhaustive-deps

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
  // v3: vertical offset applied to the altitude strip so it can be dragged in y.
  const [altOffsetY, setAltOffsetY] = useState(0)

  // Start a vertical (y-only) drag of a track. `getStart` reads the current y,
  // `setAbs` writes the new absolute y. Pointer delta is divided by the effective
  // board scale (fit × zoom) since both tracks live under those transforms.
  const startTrackDragY = (e, getStart, setAbs) => {
    if (e.button != null && e.button !== 0) return
    e.preventDefault()
    const startPointerY = e.clientY
    const startVal = getStart()
    const eff = (scale * zoomRef.current) || 1
    const move = (ev) => setAbs(startVal + (ev.clientY - startPointerY) / eff)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }
  // v3: gameReady (0 = setup, 1 = play) removed — no setup/play distinction.
  // Everything is interactive from the start: dice roll/drag, approach editable.

  // ── Offline solo (no network) ───────────────────────────────────────────────
  // Patch-2 base. The live 2-player game syncs over Firebase; this build is
  // purely local — one person drives both pilots. The game engine already has a
  // "solo" path keyed on `myRole === null`: it shows both dice trays, treats
  // every turn as the local player's, and lets the same person place both
  // colours. We hard-wire that here and drop all the presence/role/sync code.
  const isFirstPlayer = true        // local player owns setup + reset
  const canEditApproach = true      // v3: approach always editable (no lock)
  const myRole = null               // both pilots controlled locally
  const myRoleRef = useRef(null)    // long-lived closures read this (always solo)

  // Reset local turn state when turnCount advances. Drives the end-of-turn board
  // clear and clears per-altitude roll/reroll tracking. (In the online build this
  // also kept both clients in step; here it's purely local bookkeeping.)
  const prevTurnCount = useRef(gameState.turnCount)
  useEffect(() => {
    if (gameState.turnCount === prevTurnCount.current) return
    prevTurnCount.current = gameState.turnCount
    setRolledThisAlt(new Set())
    setRerollUsed(new Set())
    setRerollGranted(false)
    setDieTriggers(Object.fromEntries(ALL_DICE.map(d => [d.id, 0])))
    setPlaced({})
    setTrayDice(Object.fromEntries(TRAYS.map(t => [t.name, null])))
  }, [gameState.turnCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Turn alternation (one die at a time, SkyTeam rule) is driven directly from
  // the local placement in finalizeDrag — see the handoff block there. A synced
  // `placed`-count watcher can't be used: `placed` is merged across both clients,
  // so a peer's die arriving looks identical to a local placement and the turn
  // would bounce back and forth.

  // v3: the auto end-turn trigger (engine/axis adjudication, win/lose, altitude
  // and approach advancement) was removed. Dice place and switches/tokens toggle,
  // but nothing resolves a turn — the board is a free playfield for now.

  // ── End solo wiring ─────────────────────────────────────────────────────────
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

  // Board viewport window. The full board (altitude strip + canvas) at fit scale
  // is taller than a phone/tablet screen, which pushed the dice tray off-screen
  // and blocked scrolling to it. Cap the window to leave room for the tray below;
  // at default zoom the board overflows this window and one-finger pan navigates
  // it, while pinch-out shrinks it to show the whole board at once.
  const fullContentH = BOARD_H * scale
  const viewportH = Math.min(fullContentH, Math.max(320, availH - 220))
  viewMetricsRef.current = { vw: BOARD_W * scale, vh: viewportH, fullH: fullContentH }


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
    lastAxisRef.current = 0
    setAxisAngle(0)
    setDieTriggers(Object.fromEntries(ALL_DICE.map(d => [d.id, 0])))
    setRolledThisAlt(new Set())
    setRerollUsed(new Set())
    setRerollGranted(false)
    setTurnResult(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })

    setApproachPos(APPROACH_START)
  }

  // v3: handleEndTurn (engine/axis adjudication, win/lose, altitude + approach
  // advancement, turn handoff) was removed — no turn resolution in this build.

  // A die (in tray or on board) is hidden only once a real drag is underway.
  const isHidden = (id) => drag && drag.moved && drag.id === id
  const placedRatio = SQUARE / NATIVE
  const btnStyle = { padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 'bold', background: '#2980b9', color: '#fff', fontSize: 14 }

  return (
    <div>
      {/* Top bar — solo build (Patch 2). No roles, no presence; one local pilot
          controls both colours. */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #333', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#f1c40f', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#27ae60', display: 'inline-block', flexShrink: 0 }} />
          SkyTeam — Solo
          <span style={{ fontSize: 10, color: '#666', fontWeight: 'normal', marginLeft: 6 }}>[{BUILD}]</span>
        </div>

        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#888' }}>
          ✈ Captain (Blue) + Co-Captain (Orange)
        </div>

        {/* v3: no setup/play phase — board is always live */}
        <div style={{ fontSize: 12, color: '#666', minWidth: 150, textAlign: 'right' }}>
          <span style={{ color: gameState.activePlayer === 'blue' ? '#4a9eff' : '#ff8c42', fontWeight: 'bold' }}>
            ✈ {gameState.activePlayer === 'blue' ? 'Captain (Blue)' : 'Co-Captain (Orange)'}
          </span>
        </div>
      </div>

      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
       {/* Board viewport — clips the zoom/pan transform. Two-finger pinch zooms
           (out from the default), one finger pans; dice (data-die) are skipped so
           they keep their own drag. Trays/bar live outside and stay fixed. */}
       <div
         className="board-viewport"
         onPointerDown={onBoardPointerDown}
         onPointerMove={onBoardPointerMove}
         onPointerUp={onBoardPointerUp}
         onPointerCancel={onBoardPointerUp}
         style={{ position: 'relative', overflow: 'hidden', width: BOARD_W * scale, height: viewportH }}
       >
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: BOARD_W * scale,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
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
              data-pan
              style={{ display: 'block', userSelect: 'none' }}
            />

            {/* Altitude strip — overlay on the board canvas, draggable in y */}
            <div style={{ position: 'absolute', left: Math.round(altStrip.x), top: Math.round(altStrip.y + altOffsetY), zIndex: 15, touchAction: 'none' }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '1px 5px', marginBottom: 2, userSelect: 'none', pointerEvents: 'none', borderRadius: 3 }}>
                y: {Math.round(altStrip.y + altOffsetY)}
              </div>
              <img
                src={altitudeStripImg}
                draggable={false}
                onPointerDown={(e) => startTrackDragY(e, () => altOffsetY, setAltOffsetY)}
                style={{ display: 'block', width: Math.round(altStrip.w), height: Math.round(altStrip.h), userSelect: 'none', cursor: 'ns-resize' }}
              />
            </div>

            {/* Approach strip panels — overlaid on the board */}
            {(() => {
              return (
                <div
                  onPointerDown={(e) => { if (e.target.closest('button,input,select')) return; startTrackDragY(e, () => approachPos.y, (ny) => setApproachPos(p => ({ ...p, y: ny }))) }}
                  style={{ position: 'absolute', left: approachPos.x, top: approachPos.y, display: 'flex', flexDirection: 'column', zIndex: 10, cursor: 'ns-resize', touchAction: 'none' }}
                >
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '1px 5px', marginBottom: 2, alignSelf: 'flex-start', userSelect: 'none', pointerEvents: 'none', borderRadius: 3 }}>
                    y: {Math.round(approachPos.y)}
                  </div>
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

                          {/* destination label — centered */}
                          <input
                            readOnly={!canEditApproach}
                            value={gameState.approachHeader}
                            onChange={e => canEditApproach && dispatch({ type: 'SET_APPROACH_HEADER', value: e.target.value })}
                            onPointerDown={e => e.stopPropagation()}
                            placeholder="Destination"
                            style={{ position: 'absolute', top: 12, left: 8, right: 8, width: DEST_W - 16, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontWeight: 'bold', fontSize: 17, textAlign: 'center', fontFamily: 'sans-serif', textShadow: '0 1px 3px #000', cursor: canEditApproach ? 'text' : 'default' }}
                          />
                          {/* v3: ✓ start button removed (no gameReady gate) */}
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
                onClick={() => { if (gameState.coffeeTokens[i]) setCoffeeChoice({ tokenIndex: i }) }}
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
                if (gameState.rerollToken) {
                  dispatch({ type: 'SET_REROLL_TOKEN', value: false })
                  setRerollGranted(true)
                }
              }}
              style={{
                position: 'absolute',
                left: Math.round(px(23)) + 4,
                top: Math.round(px(28)),
                width: Math.round(px(87)),
                height: Math.round(px(102)),
                opacity: gameState.rerollToken ? 1 : 0,
                cursor: gameState.rerollToken ? 'pointer' : 'default',
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

            {/* v3: tap-to-place target highlights removed (click-to-move gone) */}

            {/* Dice placed on the board. Press-drag to pick up: moves to another
                tray, or release off the board to return to the dice tray. */}
            {ALL_DICE.filter(d => placed[d.id]).map(d => {
              const pos = placed[d.id]
              return (
                <div
                  key={d.id}
                  data-die
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
                    borderRadius: 8,
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
       </div>
      </div>

      {/* Each player sees ONLY their own colour's tray (solo sees both). The
          board, tracks and tokens stay fully in sync via gameState; the dice
          tray is the one per-player surface. */}
      {(myRole === null || myRole === 'blue') && (
        <DiceTray
          color="blue"
          dice={byColor('blue')}
          dieSize={SQUARE * scale}
          onPointerDown={startDrag}
          onRoll={handleRoll}
          draggingId={drag && drag.moved ? drag.id : null}
          rollTriggers={dieTriggers}
          coffeeTriggers={coffeeTriggers}
          coffeeHighlight={myRole !== 'orange' && !!coffeeChoice && !coffeeChoice.dieId}
          onCoffeeSelect={(myRole !== 'orange') ? (e, d) => setCoffeeChoice({ tokenIndex: coffeeChoice.tokenIndex, dieId: d.id, popupX: e.clientX, popupY: e.clientY }) : undefined}
          unrolledHighlight={(id) => !rolledThisAlt.has(id)}
          rerollHighlight={(id) => rerollGranted && !rerollUsed.has(id) && rolledThisAlt.has(id)}
          canRoll={() => true}
          onRollAll={() => handleRollAll('blue')}
          rollAllDisabled={false}
        />
      )}

      {(myRole === null || myRole === 'orange') && (
        <DiceTray
          color="orange"
          dice={byColor('orange')}
          dieSize={SQUARE * scale}
          onPointerDown={startDrag}
          onRoll={handleRoll}
          draggingId={drag && drag.moved ? drag.id : null}
          rollTriggers={dieTriggers}
          coffeeTriggers={coffeeTriggers}
          coffeeHighlight={myRole !== 'blue' && !!coffeeChoice && !coffeeChoice.dieId}
          onCoffeeSelect={(myRole !== 'blue') ? (e, d) => setCoffeeChoice({ tokenIndex: coffeeChoice.tokenIndex, dieId: d.id, popupX: e.clientX, popupY: e.clientY }) : undefined}
          unrolledHighlight={(id) => !rolledThisAlt.has(id)}
          rerollHighlight={(id) => rerollGranted && !rerollUsed.has(id) && rolledThisAlt.has(id)}
          canRoll={() => true}
          onRollAll={() => handleRollAll('orange')}
          rollAllDisabled={false}
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
      {/* v3: WIN / GAME OVER overlays removed — no adjudication to trigger them. */}

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
