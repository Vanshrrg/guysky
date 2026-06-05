/**
 * Die.jsx
 * 3D rollable die component — blue and orange variants
 * Size: 90x90px (matches board squares exactly)
 *
 * Usage:
 *   <Die color="blue" value={1} />
 *   <Die color="orange" value={3} />
 *
 * Props:
 *   color  — 'blue' | 'orange'
 *   value  — 1-6 (starting face shown)
 *
 * Click to roll — animates 3D tumble, lands on random 1-6
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import './Die.css';

const PALETTE = {
  blue:   { base: '#1515CC', highlight: '#4444ff', shadow: '#0a0a8a', border: '#0a0a99' },
  orange: { base: '#CC4400', highlight: '#ff6622', shadow: '#8a2200', border: '#992f00' },
};

// Canonical cube rotation that brings each face to the front
const FACE_ANGLE = {
  1: { x: 0,   y: 0   },
  2: { x: 0,   y: 270 },
  3: { x: 90,  y: 0   },
  4: { x: 270, y: 0   },
  5: { x: 0,   y: 90  },
  6: { x: 0,   y: 180 },
};

function DieFace({ num, color }) {
  const c = PALETTE[color] || PALETTE.blue;
  // unique IDs per face to avoid SVG gradient conflicts
  const faceGrad = `face-${color}-${num}`;
  const glossGrad = `gloss-${color}-${num}`;

  return (
    <svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={faceGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={c.highlight} />
          <stop offset="42%"  stopColor={c.base} />
          <stop offset="100%" stopColor={c.shadow} />
        </linearGradient>
        <linearGradient id={glossGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="55%"  stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Die face background */}
      <rect
        x="2" y="2" width="86" height="86" rx="16" ry="16"
        fill={`url(#${faceGrad})`}
        stroke={c.border}
        strokeWidth="2"
      />

      {/* Gloss highlight */}
      <rect
        x="8" y="6" width="74" height="44" rx="13" ry="13"
        fill={`url(#${glossGrad})`}
      />

      {/* Number */}
      <text
        x="45" y="47"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily='"Arial Black", Arial, sans-serif'
        fontWeight="900"
        fontSize="32"
        fill="#ffffff"
      >
        {num}
      </text>
    </svg>
  );
}

export default function Die({ color = 'blue', value = 1, onRoll, rollTrigger = 0, rollable = true }) {
  const init = FACE_ANGLE[value] || FACE_ANGLE[1];
  const [rot, setRot] = useState({ x: init.x, y: init.y });
  const accum = useRef({ x: init.x, y: init.y }); // cumulative rotation, never reset
  const rolling = useRef(false);

  const norm = (v) => ((v % 360) + 360) % 360;

  const roll = useCallback(() => {
    if (rolling.current) return;
    rolling.current = true;

    const target = Math.floor(Math.random() * 6) + 1;
    // Report the new face so the parent can keep the value in sync across
    // tray / drag / board (otherwise a rolled die would revert when moved).
    if (onRoll) onRoll(target);
    const t = FACE_ANGLE[target];

    // Forward delta from current normalized angle to target
    let dx = (t.x - norm(accum.current.x) + 360) % 360;
    let dy = (t.y - norm(accum.current.y) + 360) % 360;

    // Too small a turn reads as a twitch — make it a real tumble
    if (dx < 45) dx += 360;
    if (dy < 45) dy += 360;

    // Two extra full turns of momentum
    dx += 720;
    dy += 720;

    accum.current = { x: accum.current.x + dx, y: accum.current.y + dy };
    setRot({ ...accum.current });
  }, [onRoll]);

  const onEnd = useCallback(() => {
    rolling.current = false;
  }, []);

  // Sync rotation when the parent changes value externally (e.g. reset, or after
  // dragging back to tray). Skip if a roll animation is already running.
  useEffect(() => {
    if (rolling.current) return
    const target = FACE_ANGLE[value] || FACE_ANGLE[1]
    accum.current = { x: target.x, y: target.y }
    setRot({ x: target.x, y: target.y })
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // External roll trigger — when the parent increments rollTrigger, fire roll()
  useEffect(() => {
    if (rollTrigger > 0) roll();
  }, [rollTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      type="button"
      className="die-scene"
      onClick={rollable ? roll : undefined}
      aria-label={`${color} die — click to roll`}
    >
      <div className="die-ground" />
      <div
        className="die-cube"
        style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
        onTransitionEnd={onEnd}
      >
        <div className="face f1"><DieFace num={1} color={color} /></div>
        <div className="face f2"><DieFace num={2} color={color} /></div>
        <div className="face f3"><DieFace num={3} color={color} /></div>
        <div className="face f4"><DieFace num={4} color={color} /></div>
        <div className="face f5"><DieFace num={5} color={color} /></div>
        <div className="face f6"><DieFace num={6} color={color} /></div>
      </div>
    </button>
  );
}
