import { useEffect, useRef } from "react";

interface CardPos {
  x: number; // % of board width  (center)
  y: number; // % of board height (center)
  w: number; // % of board width
}

interface Props {
  discardPos: CardPos;
  deckPos: CardPos;
  cardSrc: string;
  /** How many ghost cards to animate (capped at 8 for perf) */
  count: number;
  /** px dimensions of the board container — needed for aspect ratio */
  boardW: number;
  boardH: number;
  duration?: number; // ms total, default 800
  onComplete: () => void;
}

/**
 * Full-board overlay that animates N card-backs flying from the discard pile
 * to the infection deck, then calls onComplete.
 */
export function ShuffleAnimation({
  discardPos, deckPos, cardSrc,
  count, boardW, boardH,
  duration = 800, onComplete,
}: Props) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t = setTimeout(() => onCompleteRef.current(), duration + 100);
    return () => clearTimeout(t);
  }, [duration]);

  const n = Math.min(count, 8);

  // Convert % positions to absolute for the overlay (overlay is 100% × 100% of board)
  const fromL = discardPos.x;          // left in %
  const fromT = discardPos.y;          // top  in %
  const toL   = deckPos.x;
  const toT   = deckPos.y;

  // Card pixel size based on deck width
  const cardWPx = (deckPos.w / 100) * boardW;
  const cardHPx = boardH > 0 ? cardWPx * (boardH / boardW) * 1.4 : cardWPx * 1.4;

  const uid = Math.random().toString(36).slice(2);

  // dx/dy as percentages of board dimensions
  const dxPct = toL - fromL;
  const dyPct = toT - fromT;

  return (
    <div style={{
      position: "absolute", inset: 0,
      pointerEvents: "none",
      zIndex: 9999,
      overflow: "hidden",
    }}>
      {Array.from({ length: n }).map((_, i) => {
        const delay = (i / n) * (duration * 0.5); // stagger first half of duration
        const fanAngle = (i - n / 2) * 8;          // slight fan spread at start
        const animId = `sh-${uid}-${i}`;

        return (
          <div key={i} style={{
            position: "absolute",
            left: `${fromL}%`,
            top: `${fromT}%`,
            width: cardWPx,
            height: cardHPx,
            transform: "translate(-50%, -50%)",
            transformOrigin: "center center",
            animation: `${animId} ${duration}ms cubic-bezier(0.4,0,0.2,1) ${delay}ms both`,
            borderRadius: cardWPx * 0.06,
            overflow: "hidden",
            boxShadow: "0 4px 16px #0008",
          }}>
            <img
              src={cardSrc}
              alt=""
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <style>{`
              @keyframes ${animId} {
                0%   { transform: translate(-50%,-50%) rotate(${fanAngle}deg) scale(1);   opacity: 1; }
                40%  { transform: translate(-50%,-50%) rotate(${fanAngle * 0.3}deg) scale(1.05); opacity: 1; }
                100% { transform: translate(calc(-50% + ${dxPct}vw * 0), calc(-50%))
                                  translate(${dxPct}%, ${dyPct}%)
                                  rotate(0deg) scale(0.9);
                       opacity: 0; }
              }
            `}</style>
          </div>
        );
      })}
    </div>
  );
}
