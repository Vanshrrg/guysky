/**
 * DiceTray.jsx
 * A single player's dice tray — one color only.
 *
 * Designed to stand alone: in the future, the blue player's device renders
 * <DiceTray color="blue" /> and the orange player's device renders
 * <DiceTray color="orange" />. Nothing here assumes the other tray exists.
 *
 * Props:
 *   color          — 'blue' | 'orange'
 *   dice           — array of { id, color, value } currently in the tray
 *   dieSize        — rendered size in px (pass SQUARE * boardScale)
 *   onPointerDown  — (e, die) => void   starts a custom pointer drag
 *   onRoll         — (id, value) => void called when a die is rolled (tapped)
 *   draggingId     — id of the die currently being dragged (hidden in its slot)
 */

import Die from './Die'

const NATIVE = 90 // Die's intrinsic size in px

export default function DiceTray({ color = 'blue', dice = [], dieSize = NATIVE, onPointerDown, onRoll, draggingId, rollTriggers = {}, coffeeHighlight = false, onCoffeeSelect, rollHighlight }) {
  const ratio = dieSize / NATIVE

  return (
    <div style={{
      width: '100%',
      maxWidth: 706,
      minHeight: dieSize + 24,
      margin: '12px auto 0',
      background: '#1a1a1a',
      padding: 12,
      boxSizing: 'border-box',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12
    }}>
      {dice.map((d) => (
        <div
          key={d.id}
          draggable={false}
          onPointerDown={(e) => !coffeeHighlight && onPointerDown && onPointerDown(e, d)}
          onClick={(e) => coffeeHighlight && onCoffeeSelect && onCoffeeSelect(e, d)}
          style={{
            width: dieSize,
            height: dieSize,
            cursor: coffeeHighlight ? 'pointer' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
            visibility: draggingId === d.id ? 'hidden' : 'visible',
            position: 'relative',
            borderRadius: 12,
            outline: coffeeHighlight ? '3px solid #f1c40f' : rollHighlight?.(d.id) ? '3px solid #27ae60' : 'none',
            boxShadow: coffeeHighlight ? '0 0 10px 3px rgba(241,196,15,0.7)' : rollHighlight?.(d.id) ? '0 0 10px 3px rgba(39,174,96,0.7)' : 'none',
          }}
        >
          <div style={{ transform: `scale(${ratio})`, transformOrigin: 'top left' }}>
            <Die color={d.color} value={d.value} onRoll={(v) => onRoll && onRoll(d.id, v)} rollTrigger={rollTriggers[d.id] || 0} rollable={rollHighlight ? rollHighlight(d.id) : true} />
          </div>
          {coffeeHighlight && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: 12 }} />
          )}
        </div>
      ))}
    </div>
  )
}
