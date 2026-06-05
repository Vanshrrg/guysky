// AltitudeScreen — plain white text overlay showing the current altitude level.
// Shows "- - -" when no level is set.

export default function AltitudeScreen({ value }) {
  return (
    <div className="screen altitude-screen">
      {value == null ? '- - -' : value}
    </div>
  );
}
