export const BLUE_ENGINE_VALUES = [4.5, 5.5, 6.5, 7.5]
export const ORANGE_ENGINE_VALUES = [8.5, 9.5, 10.5, 11.5, 12.5]

export const initialState = {
  dicePositions:  {},
  axisAngle:      90,
  landingGear:    [false, false, false],
  flaps:          [false, false, false, false],
  brakes:         [false, false, false],
  engineMarkers:  Array(9).fill(null),
  brakeMarker:    0,
  blueEngine:     0,
  orangeEngine:   0,
  coffeeTokens:   [false, false, false],
  rerollToken:    true,
  radio1:         null,
  radio2:         null,
  radio3:         null,
  approachSetup:    true,
  approachHeader:   '',
  approachPanels:   [
    { type: 'destination', tokens: 0 },
    { type: 'blank', tokens: 0, navRect: false },
  ],
  approachDistance: 2,
  altitude:         6
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'PLACE_DIE':
      return { ...state,
        dicePositions: { ...state.dicePositions,
          [action.squareId]: action.die }}
    case 'REMOVE_DIE': {
      const { [action.squareId]: _, ...rest } = state.dicePositions
      return { ...state, dicePositions: rest }}
    case 'SET_AXIS_ANGLE': {
      const angles = [30,60,90,120,150]
      const i = angles.indexOf(state.axisAngle)
      return { ...state,
        axisAngle: action.direction === 'left'
          ? angles[Math.max(0, i-1)]
          : angles[Math.min(4, i+1)] }}
    case 'TOGGLE_LANDING_GEAR': {
      const lg = [...state.landingGear]
      lg[action.index] = !lg[action.index]
      const blueEngine = lg.filter(Boolean).length
      return { ...state, landingGear: lg, blueEngine }
    }
    case 'TOGGLE_FLAP': {
      const fl = [...state.flaps]
      const turningOn = !fl[action.index]
      if (turningOn) {
        if (action.index > 0 && !fl[action.index - 1]) return state
        fl[action.index] = true
      } else {
        fl[action.index] = false
        for (let j = action.index + 1; j < fl.length; j++) fl[j] = false
      }
      const orangeEngine = fl.filter(Boolean).length
      return { ...state, flaps: fl, orangeEngine }
    }
    case 'TOGGLE_BRAKE': {
      const br = [...state.brakes]
      const turningOn = !br[action.index]
      if (turningOn) {
        // Can only turn on if all previous switches are already on
        if (action.index > 0 && !br[action.index - 1]) return state
        br[action.index] = true
      } else {
        // Turning off also clears all switches to the right
        br[action.index] = false
        for (let j = action.index + 1; j < br.length; j++) br[j] = false
      }
      // brakeMarker tracks how many switches are on (0=start, 1, 2, 3)
      const brakeMarker = br.filter(Boolean).length
      return { ...state, brakes: br, brakeMarker }
    }
    case 'CYCLE_ENGINE_MARKER': {
      const em = [...state.engineMarkers]
      const cycle = [null,'blue','orange']
      em[action.index] = cycle[(cycle.indexOf(em[action.index])+1)%3]
      return { ...state, engineMarkers: em }}
    case 'SET_BRAKE_MARKER':
      return { ...state, brakeMarker: state.brakeMarker === action.index ? null : action.index }
    case 'SET_BLUE_ENGINE':
      return { ...state, blueEngine: action.index }
    case 'SET_ORANGE_ENGINE':
      return { ...state, orangeEngine: action.index }
    case 'SET_COFFEE_TOKEN': {
      const ct = [...state.coffeeTokens]
      ct[action.index] = action.value
      return { ...state, coffeeTokens: ct }}
    case 'SET_REROLL_TOKEN':
      return { ...state, rerollToken: action.value }
    case 'SET_RADIO1':
      return { ...state, radio1: action.value }
    case 'SET_RADIO2':
      return { ...state, radio2: action.value }
    case 'SET_RADIO3':
      return { ...state, radio3: action.value }
    case 'SET_APPROACH_HEADER':
      return { ...state, approachHeader: action.value }
    case 'ADD_APPROACH_PANEL': {
      const panels = [...state.approachPanels, { type: 'blank', tokens: 0, navRect: false }]
      return { ...state, approachPanels: panels, approachDistance: panels.length }
    }
    case 'REMOVE_APPROACH_PANEL': {
      if (state.approachPanels.length <= 2) return state // keep at least destination + 1 blank
      const panels = state.approachPanels.slice(0, -1)
      return { ...state, approachPanels: panels, approachDistance: panels.length }
    }
    case 'SET_APPROACH_TOKENS': {
      const panels = state.approachPanels.map((p, i) =>
        i === action.index ? { ...p, tokens: Math.max(0, Math.min(3, action.value)) } : p)
      return { ...state, approachPanels: panels }
    }
    case 'TOGGLE_APPROACH_NAVRECT': {
      const panels = state.approachPanels.map((p, i) =>
        i === action.index ? { ...p, navRect: !p.navRect } : p)
      return { ...state, approachPanels: panels }
    }
    case 'ADVANCE_APPROACH': {
      const next = Math.max(0, state.approachDistance - action.value)
      return { ...state, approachDistance: next }
    }
    case 'REMOVE_APPROACH_TOKEN': {
      // find the panel whose current distance value equals action.distanceValue
      // panels[i].distanceValue = approachDistance - i
      const i = state.approachDistance - action.distanceValue
      if (i < 0 || i >= state.approachPanels.length) return state
      const panels = state.approachPanels.map((p, idx) =>
        idx === i && p.tokens > 0 ? { ...p, tokens: p.tokens - 1 } : p)
      return { ...state, approachPanels: panels }
    }
    case 'START_APPROACH_PLAY':
      return { ...state, approachSetup: false }
    case 'SET_ALTITUDE':
      return { ...state, altitude: action.value }
    case 'RESET':
      return initialState
    default:
      return state
  }
}
