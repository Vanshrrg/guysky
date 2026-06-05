// AltitudeTrack — 6 stacked slots on the right side of the board.
// Display only (no tokens). Clicking a slot makes it the active level.
// Active slot gets a 1px solid white outline (the only allowed border).

export default function AltitudeTrack({ levels, currentIndex, onSelect }) {
  return (
    <div className="altitude-track">
      {levels.map((level, i) => (
        <div
          key={i}
          className={'altitude-slot' + (i === currentIndex ? ' active' : '')}
          onClick={() => onSelect(i)}
        >
          {level}
        </div>
      ))}
    </div>
  );
}
