import offSrc from '../assets/components/off_switchupdate.png'
import onSrc from '../assets/components/on_switchupdate.png'

// A sliding toggle. The off image (button to the right) is always drawn as the
// base; the on image (button left + green glow) is overlaid on top when active.
// Both share the same slot footprint so they line up exactly.
export default function Switch({ on, onClick, x, y, width, height }) {
  const common = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    userSelect: 'none',
  }
  return (
    <div onClick={onClick} style={{ ...common, cursor: 'pointer' }}>
      <img
        src={offSrc}
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      {on && (
        <img
          src={onSrc}
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      )}
    </div>
  )
}
