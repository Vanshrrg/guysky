// Throwaway dev UI to PROVE the foundation: mutate state via sample actions,
// save/load/reset, and JSON export/import. Gets replaced by the real board in
// Prompt 2. Intentionally minimal styling.

import { useState } from "react";
import { useGame } from "../state/GameContext";
import { exportJson, importJson, load, reset, save } from "../state/persistence";

let cubeCounter = 100;

export function DevPanel() {
  const { state, dispatch } = useGame();
  const [jsonText, setJsonText] = useState("");
  const [message, setMessage] = useState("");

  const firstObjectId = state.table?.objects[0]?.id;

  function notify(msg: string) {
    setMessage(msg);
    window.setTimeout(() => setMessage(""), 2500);
  }

  return (
    <div style={{ fontFamily: "monospace", padding: 16, maxWidth: 900 }}>
      <h1>Epidemic Legacy — Dev Panel</h1>
      <p style={{ color: "#666" }}>
        Foundation harness (Prompt 1). Mutate state, then Save and reload the
        page to confirm persistence.
      </p>

      <section style={{ marginBottom: 16 }}>
        <h2>Sample actions</h2>
        <button
          onClick={() => {
            const id = `cube-${cubeCounter++}`;
            dispatch({
              type: "ADD_OBJECT",
              object: {
                id,
                kind: "diseaseCube",
                position: { zone: "city-1", x: 50, y: 50 },
                state: { color: "red" },
              },
            });
            notify(`Added ${id}`);
          }}
        >
          Add cube
        </button>{" "}
        <button
          disabled={!firstObjectId}
          onClick={() => {
            if (!firstObjectId) return;
            dispatch({
              type: "MOVE_OBJECT",
              objectId: firstObjectId,
              position: {
                zone: "city-3",
                x: Math.round(Math.random() * 100),
                y: Math.round(Math.random() * 100),
              },
            });
            notify(`Moved ${firstObjectId}`);
          }}
        >
          Move first object
        </button>{" "}
        <button
          onClick={() => {
            dispatch({ type: "DRAW_FROM_DECK", deckName: "player" });
            notify("Drew from player deck");
          }}
        >
          Draw player card
        </button>{" "}
        <button
          onClick={() => {
            dispatch({ type: "SHUFFLE_DECK", deckName: "player", seed: 42 });
            notify("Shuffled player deck (seed 42)");
          }}
        >
          Shuffle (seed 42)
        </button>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2>Persistence</h2>
        <button
          onClick={() => {
            save(state);
            notify("Saved to localStorage");
          }}
        >
          Save
        </button>{" "}
        <button
          onClick={() => {
            const loaded = load();
            if (loaded) {
              dispatch({ type: "LOAD", data: loaded });
              notify("Loaded from localStorage");
            } else {
              notify("No save found");
            }
          }}
        >
          Load
        </button>{" "}
        <button
          onClick={() => {
            reset();
            dispatch({ type: "RESET" });
            notify("Reset to fresh month-1 state");
          }}
        >
          Reset
        </button>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2>Export / Import JSON</h2>
        <button onClick={() => setJsonText(exportJson(state))}>
          Export → textarea
        </button>{" "}
        <button
          onClick={() => {
            try {
              const data = importJson(jsonText);
              dispatch({ type: "LOAD", data });
              notify("Imported JSON");
            } catch (err) {
              notify(`Import failed: ${(err as Error).message}`);
            }
          }}
        >
          Import ← textarea
        </button>
        <br />
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={8}
          style={{ width: "100%", marginTop: 8, fontFamily: "monospace" }}
          placeholder="Export writes here; paste a save here then Import."
        />
      </section>

      {message && (
        <p style={{ color: "green" }} role="status">
          {message}
        </p>
      )}

      <section>
        <h2>Live state</h2>
        <pre
          style={{
            background: "#f4f4f4",
            padding: 12,
            overflow: "auto",
            maxHeight: 400,
          }}
        >
          {JSON.stringify(state, null, 2)}
        </pre>
      </section>
    </div>
  );
}
