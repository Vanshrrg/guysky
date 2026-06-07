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

export default function DiceTray({ color = 'blue', dice = [], dieSize = NATIVE, onPointerDown, onRoll, draggingId, rollTriggers = {}, coffeeTriggers = {}, coffeeHighlight = false, onCoffeeSelect, rollHighlight, unrolledHighlight, rerollHighlight, canRoll, onRollAll, rollAllDisabled = false, selectedId = null }) {
  const ratio = dieSize / NATIVE

  const getOutline = (id) => {
    if (id === selectedId)        return '3px solid #2ecc71'
    if (coffeeHighlight)          return '3px solid #f1c40f'
    if (rerollHighlight?.(id))    return '3px solid #a855f7'
    if (unrolledHighlight?.(id))  return '3px solid #e74c3c'
    return 'none'
  }

  const getShadow = (id) => {
    if (id === selectedId)        return '0 0 14px 5px rgba(46,204,113,0.85)'
    if (coffeeHighlight)          return '0 0 10px 3px rgba(241,196,15,0.7)'
    if (rerollHighlight?.(id))    return '0 0 14px 5px rgba(168,85,247,0.85)'
    if (unrolledHighlight?.(id))  return '0 0 14px 5px rgba(231,76,60,0.85)'
    return 'none'
  }

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
      {onRollAll && (
        <button
          onClick={onRollAll}
          disabled={rollAllDisabled}
          style={{
            padding: '8px 14px',
            fontSize: 14,
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            background: rollAllDisabled ? '#555' : '#2980b9',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: rollAllDisabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            opacity: rollAllDisabled ? 0.5 : 1,
            flexShrink: 0,
          }}
        >
          Roll
        </button>
      )}
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
            outline: getOutline(d.id),
            boxShadow: getShadow(d.id),
          }}
        >
          <div style={{ transform: `scale(${ratio})`, transformOrigin: 'top left' }}>
            <Die color={d.color} value={d.value} onRoll={(v) => onRoll && onRoll(d.id, v)} rollTrigger={rollTriggers[d.id] || 0} coffeeTrigger={coffeeTriggers[d.id] || 0} rollable={canRoll ? canRoll(d.id) : true} />
          </div>
          {coffeeHighlight && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: 12 }} />
          )}
        </div>
      ))}
    </div>
  )
}
