// A reducer over the whole SaveData tree. Action variants wrap the pure table
// actions (SPEC §11.1), plus LOAD (replace tree) and RESET (fresh month-1).

import {
  addObject,
  drawFromDeck,
  moveObject,
  removeObject,
  shuffleDeck,
  updateObjectState,
} from "./actions";
import { createSaveData } from "./initialState";
import type {
  GameObject,
  ObjectState,
  Position,
  SaveData,
  TableState,
} from "./types";

export type GameAction =
  | { type: "MOVE_OBJECT"; objectId: string; position: Position }
  | { type: "ADD_OBJECT"; object: GameObject }
  | { type: "REMOVE_OBJECT"; objectId: string }
  | { type: "UPDATE_OBJECT_STATE"; objectId: string; partialState: Partial<ObjectState> }
  | { type: "DRAW_FROM_DECK"; deckName: string }
  | { type: "SHUFFLE_DECK"; deckName: string; seed: number | string }
  | { type: "LOAD"; data: SaveData }
  | { type: "RESET" };

/** Apply a table-mutating action, keeping the surrounding SaveData intact. */
function withTable(
  state: SaveData,
  fn: (table: TableState) => TableState,
): SaveData {
  if (!state.table) return state;
  return { ...state, table: fn(state.table) };
}

export function gameReducer(state: SaveData, action: GameAction): SaveData {
  switch (action.type) {
    case "MOVE_OBJECT":
      return withTable(state, (t) => moveObject(t, action.objectId, action.position));
    case "ADD_OBJECT":
      return withTable(state, (t) => addObject(t, action.object));
    case "REMOVE_OBJECT":
      return withTable(state, (t) => removeObject(t, action.objectId));
    case "UPDATE_OBJECT_STATE":
      return withTable(state, (t) =>
        updateObjectState(t, action.objectId, action.partialState),
      );
    case "DRAW_FROM_DECK":
      return withTable(state, (t) => drawFromDeck(t, action.deckName).table);
    case "SHUFFLE_DECK":
      return withTable(state, (t) => shuffleDeck(t, action.deckName, action.seed));
    case "LOAD":
      return action.data;
    case "RESET":
      return createSaveData();
    default:
      return state;
  }
}
