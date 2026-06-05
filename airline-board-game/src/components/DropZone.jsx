// DropZone — invisible, transparent overlay that accepts a dragged die.
// The ONLY allowed invisible overlay (Section 1, Rule 5). No visual styling.

export default function DropZone({ zone, onDropDie }) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dieId = e.dataTransfer.getData('text/plain');
    if (dieId) onDropDie(zone.id, dieId);
  };

  return (
    <div
      className="abs drop-zone"
      data-zone={zone.id}
      style={{ left: zone.x, top: zone.y, width: zone.w, height: zone.h }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    />
  );
}
