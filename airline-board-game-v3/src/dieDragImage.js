// Builds a flat, static drag image for a die so the browser's drag ghost is a
// clean square — not a snapshot of the live 3D cube (which drags rotated and
// clipped). The element is appended off-screen by the caller, handed to
// dataTransfer.setDragImage, then removed on the next tick.

const PALETTE = {
  blue:   { base: '#1515CC', highlight: '#4444ff', shadow: '#0a0a8a', border: '#0a0a99' },
  orange: { base: '#CC4400', highlight: '#ff6622', shadow: '#8a2200', border: '#992f00' },
}

function faceSvg(color, value) {
  const c = PALETTE[color] || PALETTE.blue
  return `
    <svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="f" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c.highlight}"/>
          <stop offset="42%" stop-color="${c.base}"/>
          <stop offset="100%" stop-color="${c.shadow}"/>
        </linearGradient>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
          <stop offset="55%" stop-color="#ffffff" stop-opacity="0.10"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="86" height="86" rx="16" ry="16" fill="url(#f)" stroke="${c.border}" stroke-width="2"/>
      <rect x="8" y="6" width="74" height="44" rx="13" ry="13" fill="url(#g)"/>
      <text x="45" y="47" text-anchor="middle" dominant-baseline="central"
            font-family="'Arial Black', Arial, sans-serif" font-weight="900"
            font-size="32" fill="#ffffff">${value}</text>
    </svg>`
}

// Returns a detached DOM element sized `size` px. Caller must append it to the
// document (off-screen) before calling setDragImage, and remove it after.
export function createDieDragImage(color, value, size) {
  const el = document.createElement('div')
  el.style.position = 'fixed'
  el.style.top = '-1000px'
  el.style.left = '-1000px'
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.pointerEvents = 'none'
  el.innerHTML = faceSvg(color, value)
  return el
}
