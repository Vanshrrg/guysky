# Board Component Sizes & Positions
## Reference: 706x856px diagram image

Canvas: 706 x 856px
Base square unit: 90x90px (12.7% of canvas width)

---

## All Components — Exact Pixel Positions & Sizes

| Component | X | Y | W | H | Ratio | % Width |
|-----------|---|---|---|---|-------|---------|
| **Reroll Button** | 18 | 18 | 95 | 95 | 1:1 | 13.5% |
| **Current Position Screen** | 168 | 18 | 168 | 60 | 2.8:1 | 23.8% |
| **Current Altitude Screen** | 368 | 18 | 168 | 60 | 2.8:1 | 23.8% |
| **Radio (top right)** | 610 | 18 | 80 | 80 | 1:1 | 11.3% |
| **Radio (left)** | 18 | 125 | 95 | 95 | 1:1 | 13.5% |
| **Axis Dial** | 218 | 100 | 270 | 270 | 1:1 | 38.2% |
| **Left Col Square 1** | 62 | 290 | 90 | 90 | 1:1 | 12.7% |
| **Left Col Switch 1** | 62 | 388 | 90 | 40 | 2.25:1 | 12.7% |
| **Left Col Square 2** | 62 | 440 | 90 | 90 | 1:1 | 12.7% |
| **Left Col Switch 2** | 62 | 538 | 90 | 40 | 2.25:1 | 12.7% |
| **Left Col Square 3** | 62 | 590 | 90 | 90 | 1:1 | 12.7% |
| **Left Col Switch 3** | 62 | 688 | 90 | 40 | 2.25:1 | 12.7% |
| **Right Col Square 1** | 554 | 290 | 90 | 90 | 1:1 | 12.7% |
| **Right Col Switch 1** | 554 | 388 | 90 | 40 | 2.25:1 | 12.7% |
| **Right Col Square 2** | 554 | 440 | 90 | 90 | 1:1 | 12.7% |
| **Right Col Switch 2** | 554 | 538 | 90 | 40 | 2.25:1 | 12.7% |
| **Right Col Square 3** | 554 | 590 | 90 | 90 | 1:1 | 12.7% |
| **Right Col Switch 3** | 554 | 688 | 90 | 40 | 2.25:1 | 12.7% |
| **Right Col Square 4** | 554 | 740 | 90 | 90 | 1:1 | 12.7% |
| **Engine Zone** | 218 | 390 | 270 | 100 | 2.7:1 | 38.2% |
| **Engine Square 1** | 218 | 390 | 90 | 90 | 1:1 | 12.7% |
| **Engine Square 2** | 398 | 390 | 90 | 90 | 1:1 | 12.7% |
| **Brakes Arc Zone** | 218 | 500 | 270 | 130 | 2.08:1 | 38.2% |
| **Brakes Square 1** | 218 | 640 | 75 | 75 | 1:1 | 10.6% |
| **Brakes Square 2** | 315 | 640 | 75 | 75 | 1:1 | 10.6% |
| **Brakes Square 3** | 412 | 640 | 75 | 75 | 1:1 | 10.6% |
| **Concentration Zone** | 168 | 735 | 370 | 100 | 3.7:1 | 52.4% |
| **Conc Square 1** | 200 | 745 | 90 | 80 | 1.12:1 | 12.7% |
| **Conc Square 2** | 308 | 745 | 90 | 80 | 1.12:1 | 12.7% |
| **Conc Square 3** | 416 | 745 | 90 | 80 | 1.12:1 | 12.7% |
| **Coffee Token Zone** | 18 | 740 | 130 | 100 | 1.3:1 | 18.4% |

---

## Key Measurements Summary

### Base Unit
- **All dice squares**: 90 x 90px
- **All switches**: 90 x 40px
- **Brakes squares** (slightly smaller): 75 x 75px

### Unique Sizes
- **Reroll**: 95 x 95px (square)
- **Radio buttons**: 80-95 x 80-95px (square)
- **Axis Dial**: 270 x 270px (square, 3x base unit)
- **Position Screen**: 168 x 60px (wide rectangle)
- **Altitude Screen**: 168 x 60px (wide rectangle, same as position)
- **Concentration zone**: 370 x 100px (wide)

### Scaling Factor
If you want to build at a different canvas size, multiply all values by:
- **800px wide canvas**: multiply all by 1.133
- **600px wide canvas**: multiply all by 0.850
- **500px wide canvas**: multiply all by 0.708

---

## CSS Variables to Use in React

```css
:root {
  --canvas-w: 706px;
  --canvas-h: 856px;
  --unit: 90px;          /* base square size */
  --unit-sm: 75px;       /* brakes squares */
  --switch-h: 40px;      /* switch height */
  --dial-size: 270px;    /* axis dial */
  --screen-w: 168px;     /* position/altitude screens */
  --screen-h: 60px;
  --reroll-size: 95px;
  --radio-size: 80px;
}
```

---

## Drop Zone Absolute Positions (for App.jsx)

```javascript
const DROP_ZONES = [
  // Radio (left) — 3 squares
  { id: "radio_left_1",    x: 62,  y: 290, w: 90, h: 90 },
  { id: "radio_left_2",    x: 62,  y: 440, w: 90, h: 90 },
  { id: "radio_left_3",    x: 62,  y: 590, w: 90, h: 90 },

  // Axis — 2 squares (positioned left/right of dial)
  { id: "axis_1",          x: 218, y: 390, w: 90, h: 90 },
  { id: "axis_2",          x: 398, y: 390, w: 90, h: 90 },

  // Engine — 2 squares
  { id: "engine_1",        x: 218, y: 390, w: 90, h: 90 },
  { id: "engine_2",        x: 398, y: 390, w: 90, h: 90 },

  // Landing Gear (right col) — 3 squares
  { id: "landing_1",       x: 554, y: 290, w: 90, h: 90 },
  { id: "landing_2",       x: 554, y: 440, w: 90, h: 90 },
  { id: "landing_3",       x: 554, y: 590, w: 90, h: 90 },

  // Flaps (right col) — 4 squares
  { id: "flaps_1",         x: 554, y: 290, w: 90, h: 90 },
  { id: "flaps_2",         x: 554, y: 440, w: 90, h: 90 },
  { id: "flaps_3",         x: 554, y: 590, w: 90, h: 90 },
  { id: "flaps_4",         x: 554, y: 740, w: 90, h: 90 },

  // Brakes — 3 squares
  { id: "brakes_1",        x: 218, y: 640, w: 75, h: 75 },
  { id: "brakes_2",        x: 315, y: 640, w: 75, h: 75 },
  { id: "brakes_3",        x: 412, y: 640, w: 75, h: 75 },

  // Concentration — 3 squares
  { id: "conc_1",          x: 200, y: 745, w: 90, h: 80 },
  { id: "conc_2",          x: 308, y: 745, w: 90, h: 80 },
  { id: "conc_3",          x: 416, y: 745, w: 90, h: 80 },
]
```

---

## Notes
- All X,Y are top-left corner of component
- Measured from top-left of 706x856px canvas
- These are estimates from diagram — fine-tune after placing board.png as background
- Switches sit directly below their corresponding squares with ~8px gap
