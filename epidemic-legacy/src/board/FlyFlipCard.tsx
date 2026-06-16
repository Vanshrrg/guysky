import { useEffect } from "react";
import type { ReactNode } from "react";

interface Props {
  fromX: number; fromY: number;   // % of board — centre of deck top card
  toX:   number; toY:   number;   // % of board — centre of discard top card
  cardW: number; cardH: number;   // px
  backSrc: string;
  front: ReactNode;
  boardW: number; boardH: number; // actual px of the board container
  duration?: number;
  onComplete?: () => void;
}

export function FlyFlipCard({
  fromX, fromY, toX, toY,
  cardW, cardH,
  backSrc, front,
  boardW, boardH,
  duration = 600,
  onComplete,
}: Props) {
  useEffect(() => {
    const t = setTimeout(() => onComplete?.(), duration + 50);
    return () => clearTimeout(t);
  }, [duration, onComplete]);

  // Pixel delta from start to end
  const dx = ((toX - fromX) / 100) * boardW;
  const dy = ((toY - fromY) / 100) * boardH;

  const uid = Math.random().toString(36).slice(2);

  return (
    <div style={{
      position: "absolute", inset: 0,
      pointerEvents: "none",
      zIndex: 9999,
      overflow: "hidden",
    }}>
      {/* Outer div centred at FROM — matches deck card positioning exactly */}
      <div style={{
        position: "absolute",
        left: `${fromX}%`,
        top:  `${fromY}%`,
        width: cardW,
        height: cardH,
        transform: "translate(-50%, -50%)",
        perspective: cardW * 4,
      }}>
        <div style={{
          width: "100%", height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          animation: `flyflip-${uid} ${duration}ms cubic-bezier(0.4,0,0.2,1) forwards`,
        }}>
          {/* Front face */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}>
            {front}
          </div>

          {/* Back face — starts facing the viewer */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            overflow: "hidden",
            borderRadius: cardW * 0.06,
          }}>
            <img
              src={backSrc} alt="" draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flyflip-${uid} {
          0%   { transform: rotateY(180deg) scale(1); }
          50%  { transform: translate(${dx * 0.5}px, ${dy * 0.5}px) rotateY(270deg) scale(1.06); }
          100% { transform: translate(${dx}px, ${dy}px) rotateY(360deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
