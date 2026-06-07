// The board surface. The board image is intentionally NOT wired in yet — a new
// board art file will be added later. For now this renders an empty,
// percentage-based, aspect-locked frame that cities and objects layer on top of
// (SPEC §6: everything placed by percentage so the board scales).

export function Board() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 1100,
        aspectRatio: "600 / 420",
        margin: "0 auto",
        background: "#0e2030",
        border: "1px solid #1d3b54",
        borderRadius: 6,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          color: "#5a7a93",
          fontFamily: "monospace",
        }}
      >
        Board placeholder — drop new board art here
      </div>
      {/* Overlay layer for cities + objects (added later). */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
    </div>
  );
}
