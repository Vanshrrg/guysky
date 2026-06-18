/**
 * Die.jsx
 * 3D rollable die component — blue and orange variants
 * Size: 90x90px (matches board squares exactly)
 *
 * Animation modes:
 *   roll    — full tumble (click or rollTrigger)
 *   coffee  — short single Y-axis flip (coffeeTrigger)
 *   snap    — instant, no transition (value sync / return from board)
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
      <rect x="2" y="2" width="86" height="86" rx="16" ry="16"
        fill={`url(#${faceGrad})`} stroke={c.border} strokeWidth="2" />
      <rect x="8" y="6" width="74" height="44" rx="13" ry="13"
        fill={`url(#${glossGrad})`} />
      <text x="45" y="47" textAnchor="middle" dominantBaseline="central"
        fontFamily='"Arial Black", Arial, sans-serif' fontWeight="900"
        fontSize="32" fill="#ffffff">
        {num}
      </text>
    </svg>
  );
}

export default function Die({ color = 'blue', value = 1, onRoll, rollTrigger = 0, coffeeTrigger = 0, rollable = true }) {
  const init = FACE_ANGLE[value] || FACE_ANGLE[1];
  const [rot, setRot] = useState({ x: init.x, y: init.y });
  const [animClass, setAnimClass] = useState('');
  const accum = useRef({ x: init.x, y: init.y });
  const animating = useRef(false);

  const norm = (v) => ((v % 360) + 360) % 360;

  const roll = useCallback(() => {
    if (animating.current) return;
    animating.current = true;
    setAnimClass('anim-roll');

    const target = Math.floor(Math.random() * 6) + 1;
    if (onRoll) onRoll(target);
    const t = FACE_ANGLE[target];

    let dx = (t.x - norm(accum.current.x) + 360) % 360;
    let dy = (t.y - norm(accum.current.y) + 360) % 360;
    if (dx < 45) dx += 360;
    if (dy < 45) dy += 360;
    dx += 720;
    dy += 720;

    accum.current = { x: accum.current.x + dx, y: accum.current.y + dy };
    setRot({ ...accum.current });
  }, [onRoll]);

  const onEnd = useCallback(() => {
    animating.current = false;
    setAnimClass('');
  }, []);

  // External roll trigger (Roll button) — use ref to ignore stale value on remount
  const prevRollTrigger = useRef(rollTrigger);
  useEffect(() => {
    if (rollTrigger > prevRollTrigger.current) roll();
    prevRollTrigger.current = rollTrigger;
  }, [rollTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Coffee flip — single Y-axis sweep right-to-left to new value
  const prevCoffeeTrigger = useRef(coffeeTrigger);
  useEffect(() => {
    if (coffeeTrigger <= prevCoffeeTrigger.current) return;
    prevCoffeeTrigger.current = coffeeTrigger;
    if (animating.current) return;
    animating.current = true;
    setAnimClass('anim-coffee');

    const t = FACE_ANGLE[value] || FACE_ANGLE[1];
    // Right-to-left = negative Y direction (subtract to go backward)
    let dy = (norm(accum.current.y) - t.y + 360) % 360;
    if (dy < 90) dy += 360; // ensure at least one visible face sweeps past
    accum.current = { x: t.x, y: accum.current.y - dy };
    setRot({ ...accum.current });
  }, [coffeeTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Value sync — instant snap, no animation (return from board, reset, etc.)
  useEffect(() => {
    if (animating.current) return;
    const target = FACE_ANGLE[value] || FACE_ANGLE[1];
    accum.current = { x: target.x, y: target.y };
    setRot({ x: target.x, y: target.y });
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      type="button"
      className="die-scene"
      onClick={rollable ? roll : undefined}
      aria-label={`${color} die — click to roll`}
    >
      <div className="die-ground" />
      <div
        className={`die-cube${animClass ? ' ' + animClass : ''}`}
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
