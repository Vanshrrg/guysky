// PositionScreen — plain white text overlay showing the current position
// (lowest occupied Approach Track slot). Shows "- - -" when nothing is placed.

export default function PositionScreen({ value }) {
  return (
    <div className="screen position-screen">
      {value == null ? '- - -' : value}
    </div>
  );
}
