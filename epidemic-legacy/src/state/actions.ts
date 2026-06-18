// Generic table actions (SPEC §11.1). These are the *only* mutators of the
// table — there is no rules engine. Every function is pure: it returns a new
// TableState (and never mutates its input), which keeps state serializable,
// testable, and React-friendly.

import { makeRng } from "./rng";
import type { GameObject, ObjectState, Position, TableState } from "./types";

/** Move an object to a new position (zone + percentage x/y). */
export function moveObject(
  table: TableState,
  objectId: string,
  position: Position,
): TableState {
  return {
    ...table,
    objects: table.objects.map((o) =>
      o.id === objectId ? { ...o, position: { ...position } } : o,
    ),
  };
}

/** Add a new piece to the table. */
export function addObject(table: TableState, object: GameObject): TableState {
  return { ...table, objects: [...table.objects, object] };
}

/** Remove a piece, and drop its id from any deck it sits in. */
export function removeObject(table: TableState, objectId: string): TableState {
  const decks = Object.fromEntries(
    Object.entries(table.decks).map(([name, ids]) => [
      name,
      ids.filter((id) => id !== objectId),
    ]),
  );
  return {
    ...table,
    objects: table.objects.filter((o) => o.id !== objectId),
    decks,
  };
}

/** Merge a partial state into an object's state (flip: faceUp, recolor: color). */
export function updateObjectState(
  table: TableState,
  objectId: string,
  partialState: Partial<ObjectState>,
): TableState {
  return {
    ...table,
    objects: table.objects.map((o) =>
      o.id === objectId ? { ...o, state: { ...o.state, ...partialState } } : o,
    ),
  };
}

/**
 * Draw the top id off a deck. Top = end of the array (cheap push/pop). Returns
 * the new table and the drawn id (null if the deck is empty/missing).
 */
export function drawFromDeck(
  table: TableState,
  deckName: string,
): { table: TableState; drawnId: string | null } {
  const deck = table.decks[deckName];
  if (!deck || deck.length === 0) return { table, drawnId: null };
  const drawnId = deck[deck.length - 1];
  return {
    table: { ...table, decks: { ...table.decks, [deckName]: deck.slice(0, -1) } },
    drawnId,
  };
}

/** Fisher–Yates shuffle of a deck using a seeded PRNG (reproducible). */
export function shuffleDeck(
  table: TableState,
  deckName: string,
  seed: number | string,
): TableState {
  const deck = table.decks[deckName];
  if (!deck) return table;
  const rng = makeRng(seed);
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { ...table, decks: { ...table.decks, [deckName]: shuffled } };
}
