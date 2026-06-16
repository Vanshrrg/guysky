import { useEffect } from "react";
import type { ReactNode } from "react";

interface Props {
  front: ReactNode;
  backSrc: string;
  width: number;
  height: number;
  duration?: number;        // ms, default 600
  reverse?: boolean;        // true = front→back (0→180°); false/default = back→front (180→360°)
  onComplete?: () => void;
}

/**
 * Plays a 3-D rotateY flip: starts face-down (back visible), flips to face-up (front visible).
 * Calls onComplete when the animation finishes.
 */
export function CardFlip({ front, backSrc, width, height, duration = 600, reverse = false, onComplete }: Props) {
  useEffect(() => {
    const t = setTimeout(() => onComplete?.(), duration + 50);
    return () => clearTimeout(t);
  }, [duration, onComplete]);

  const uid = Math.random().toString(36).slice(2); // unique per mount so keyframe names don't clash

  return (
    <div style={{ width, height, perspective: width * 4, position: "relative" }}>
      {/* Animated container */}
      <div style={{
        width: "100%", height: "100%",
        position: "relative",
        transformStyle: "preserve-3d",
        animation: `flip-${uid} ${duration}ms cubic-bezier(0.4,0,0.2,1) forwards`,
      }}>
        {/* Front face */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}>
          {front}
        </div>

        {/* Back face — starts facing viewer */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          overflow: "hidden",
          borderRadius: width * 0.06,
        }}>
          <img
            src={backSrc}
            alt=""
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
          />
        </div>
      </div>

      {/* Inline keyframe: direction depends on reverse prop */}
      <style>{`
        @keyframes flip-${uid} {
          from { transform: rotateY(${reverse ? "0deg" : "180deg"}); }
          to   { transform: rotateY(${reverse ? "180deg" : "360deg"}); }
        }
      `}</style>
    </div>
  );
}
