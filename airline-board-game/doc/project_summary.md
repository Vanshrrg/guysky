# Airline Board Game — Project Summary
## For Claude Code & Claude Artifacts

---

## Project Overview
An interactive digital airline board game panel built as a **React + Vite web app**.
Board image used as PNG background. Only interactive/dynamic parts built in code.

---

## Tech Stack
- React + Vite
- SVG for complex shapes (Axis tilt, Arc sliders)
- PNG assets for static visual pieces
- CSS absolute positioning for overlays
- HTML5 drag and drop for dice
- useState for all game state

---

## Component List (7 Total)

| # | Component | Build Method | Behavior |
|---|-----------|--------------|----------|
| 1 | Board | PNG background + SVG/HTML overlays | Static background |
| 2 | 8 Dice | Claude artifact → draggable JSX | Drag and drop onto squares |
| 3 | Coffee Token | PNG asset | Show/hide by condition only |
| 4 | Reroll Token | PNG asset | Show/hide by condition only |
| 5 | Position Screen | Claude artifact | Displays lowest plane on Approach Track |
| 6 | Altitude Screen | Claude artifact | Displays current altitude level |
| 7 | Approach Track | Claude artifact | Plane tokens placed/removed, slideable |

---

## Board Sub-Components (10 Total)

### 1. Reroll
- 1 drop zone for reroll token
- Token appears/disappears by condition

### 2. Current Position Screen
- Display screen
- Shows the LOWEST plane token on the Approach Track
- Updates automatically when Approach Track changes

### 3. Current Altitude Screen
- Display screen
- Shows current altitude level
- Predetermined track — no tokens placed on it
- Value updates as altitude changes

### 4. Radio
- 3 squares = dice drop zones only

### 5. Axis
- 2 squares = dice drop zones
- SVG tiltable plane (drag left/right to tilt)

### 6. Engine
- 2 squares = dice drop zones
- 9 marker spaces (accept blue or orange markers, click to place)

### 7. Landing Gear
- 3 squares = dice drop zones
- Flippable switches (click to toggle up/down)

### 8. Flaps
- 4 squares = dice drop zones
- Flippable switches (click to toggle up/down)

### 9. Brakes
- 3 squares = dice drop zones
- Flippable switches (click to toggle up/down)
- Spaces for red markers (click to place/remove)

### 10. Concentration
- 3 squares = dice drop zones
- 3 spaces for coffee tokens (show/hide by condition)

---

## Approach Track Component (NEW)

### Visual
- Vertical strip on the left side of board
- 6 slots stacked from top to bottom
- Each slot shows a plane icon (1–4 planes visible)
- Reference image: YUL Montreal Trudeau card style
- Dark blue background per slot
- White plane silhouette icons

### Plane Tokens
- Plane tokens can be manually placed INTO any slot
- Plane tokens can be manually removed FROM any slot
- Tokens are NOT the same as dice — they are plane-shaped assets
- Lowest occupied slot = current position shown on Position Screen

### Slide Down Mechanic
- A "slide down" action removes the LOWEST token
- All remaining tokens shift down one slot
- Position Screen updates to show new lowest token
- This simulates the plane advancing in approach sequence

### State
```javascript
approachTrack: [
  { slot: 1, hasToken: false },
  { slot: 2, hasToken: false },
  { slot: 3, hasToken: true },
  { slot: 4, hasToken: true },
  { slot: 5, hasToken: true },
  { slot: 6, hasToken: true },  // lowest = shown on position screen
]
```

### Rules
- Lowest occupied slot → shown on Current Position Screen
- Slide down button → removes lowest token, shifts all down
- Tokens can be clicked to add or remove manually

---

## Altitude Track Component

### Visual
- Vertical strip on the right side of board
- Predetermined fixed slots with values: 1000, 200, 3000, 4000, 5000, 600
- Each slot is a display row showing the altitude value
- Coin/token icons on some rows (visual only, from reference image)
- Dark background, cyan/orange accent colors per slot

### Behavior
- NO tokens placed on it — display only
- Current altitude level highlighted
- Altitude Screen shows the currently active level
- Level changes by game logic (not drag/drop)

### State
```javascript
altitudeTrack: {
  levels: [1000, 200, 3000, 4000, 5000, 600],
  currentIndex: 0   // which level is currently active
}
```

---

## Dice System

### Dice Assets
- 4 blue dice (numbers 1–4, or random 1–6 on roll)
- 4 orange dice (numbers 1–4, or random 1–6 on roll)
- Size: exactly same as board squares
- Stored in DiceTray below the board when not placed

### Drag and Drop Rules
- Dice dragged FROM tray → dropped ONTO valid board squares
- Dice can be picked up from squares and returned to tray
- Blue and orange dice both accepted on all squares (no color restriction unless game rules specify)

### Drop Zone Squares Count
| Sub-Component | Squares |
|---------------|---------|
| Radio | 3 |
| Axis | 2 |
| Engine | 2 |
| Landing Gear | 3 |
| Flaps | 4 |
| Brakes | 3 |
| Concentration | 3 |
| **Total** | **20** |

---

## Token System

| Token | Count | Behavior | Placed On |
|-------|-------|----------|-----------|
| Coffee Token | 3 | Show/hide by condition | Concentration (3 slots) |
| Reroll Token | 1 | Show/hide by condition | Reroll zone |
| Plane Token | 6 | Click to add/remove | Approach Track slots |
| Blue Marker | 9 | Click to place | Engine spaces |
| Orange Marker | 9 | Click to place | Engine spaces |
| Red Marker | ? | Click to place | Brakes spaces |

---

## Switch System

| Location | Count | Type |
|----------|-------|------|
| Landing Gear | 3 | Flip up/down |
| Flaps | 4 | Flip up/down |
| Brakes | 3 | Flip up/down |

---

## Game State Structure

```javascript
const [gameState, setState] = useState({

  // Dice
  dice: {
    blue: [1, 2, 3, 4],
    orange: [1, 2, 3, 4]
  },
  dicePositions: {},  // { squareId: dieId }

  // Approach Track
  approachTrack: Array(6).fill(false),  // true = has plane token
  // lowest true index = current position

  // Altitude Track
  altitudeTrack: {
    levels: [1000, 200, 3000, 4000, 5000, 600],
    currentIndex: 0
  },

  // Tokens (show/hide only)
  coffeeTokens: [false, false, false],
  rerollToken: false,

  // Markers
  engineMarkers: Array(9).fill(null),   // null / 'blue' / 'orange'
  brakeMarkers: Array(3).fill(false),

  // Switches
  landingGear: [false, false, false],
  flaps: [false, false, false, false],
  brakes: [false, false, false],

  // Axis
  axisTilt: 0,  // degrees, drag to change

  // Screens (derived from track state)
  // currentPosition = computed from approachTrack
  // currentAltitude = computed from altitudeTrack.currentIndex

})
```

---

## File Structure

```
airline-board-game/
├── public/
│   └── board.png                  ← full board PNG background
├── src/
│   ├── assets/
│   │   ├── board.png
│   │   ├── coffee_token.png
│   │   ├── reroll_token.png
│   │   ├── plane_token.png        ← for approach track
│   │   └── icons/                 ← any cropped icon PNGs
│   ├── components/
│   │   ├── Axis.jsx               ← SVG tiltable plane
│   │   ├── ApproachTrack.jsx      ← vertical track, plane tokens, slide down
│   │   ├── AltitudeTrack.jsx      ← vertical track, display only
│   │   ├── PositionScreen.jsx     ← shows lowest approach track slot
│   │   ├── AltitudeScreen.jsx     ← shows current altitude level
│   │   ├── Dice.jsx               ← single die component
│   │   ├── DiceTray.jsx           ← holds all 8 dice
│   │   ├── DropZone.jsx           ← reusable square drop zone
│   │   ├── Switch.jsx             ← reusable flip switch
│   │   ├── Marker.jsx             ← reusable marker (blue/orange/red)
│   │   └── TokenDisplay.jsx       ← show/hide coffee and reroll tokens
│   ├── App.jsx                    ← combines everything
│   ├── App.css                    ← layout, positioning
│   └── gameState.js               ← initial state and reducer
```

---

## Build Phases

### Phase 1: Asset Preparation (Figma)
- Crop board.png from original photo
- Crop coffee_token.png
- Crop reroll_token.png
- Crop plane_token.png (from approach track reference image)
- Export all at 2x resolution as PNG

### Phase 2: Build in Claude Artifacts (piece by piece)
1. Dice component — visual first, then draggable
2. Axis SVG — tiltable plane
3. ApproachTrack — slots, plane tokens, slide down button
4. AltitudeTrack — display only, highlight active level
5. PositionScreen — reads lowest approach track slot
6. AltitudeScreen — reads current altitude index
7. Switch component — reusable flip switch
8. Marker component — reusable click-to-place marker

### Phase 3: Combine in Claude Code
- Set up Vite project
- Import all PNG assets
- Import all JSX components
- Build App.jsx with board.png as background
- Position all components as absolute overlays
- Wire all state together

### Phase 4: Visual Alignment
- Screenshot vs reference image comparison
- Adjust positioning and sizing
- Pixel-perfect match

### Phase 5: Interactivity Polish
- Drag/drop animations
- Switch flip animations
- Approach track slide animation
- Token appear/disappear transitions

### Phase 6: Deploy
- Build for GitHub Pages
- npm run build + deploy

---

## Key Rules for Claude

1. Board image used AS-IS as PNG background — never rebuild static parts
2. All assets saved as PNG (not JPG)
3. All components saved as JSX
4. Dice size must exactly match board squares
5. SVG used for Axis tilt and any arc/circular elements
6. CSS position:absolute for all overlays on top of board PNG
7. Approach Track lowest token drives Position Screen (computed, not manual)
8. Altitude Track is display only — no drag/drop
9. Coffee and Reroll tokens are show/hide only — not draggable
10. One component at a time — verify visually before combining
