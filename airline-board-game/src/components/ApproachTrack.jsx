// ApproachTrack — 6 stacked slots on the left side of the board.
// Occupied slot shows plane_token.png; empty slot shows nothing (still clickable).
// Slide Down removes the lowest occupied token (handled by the reducer).

import planeToken from '../assets/components/plane_token.png';

export default function ApproachTrack({ track, onToggle, onSlideDown }) {
  return (
    <div className="approach-track">
      {track.map((occupied, i) => (
        <div
          key={i}
          className="approach-slot"
          onClick={() => onToggle(i)}
        >
          {occupied && (
            <img className="plane-token" src={planeToken} alt="" draggable={false} />
          )}
        </div>
      ))}
      <button type="button" className="text-btn slide-down-btn" onClick={onSlideDown}>
        SLIDE DOWN
      </button>
    </div>
  );
}
