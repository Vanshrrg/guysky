import { describe, expect, it } from "vitest";
import {
  addObject,
  drawFromDeck,
  moveObject,
  removeObject,
  shuffleDeck,
  updateObjectState,
} from "./actions";
import { createSaveData, createTable } from "./initialState";
import { exportJson, importJson } from "./persistence";
import type { GameObject } from "./types";

const sampleObject: GameObject = {
  id: "x-1",
  kind: "roadBlock",
  position: { zone: "route-1", x: 10, y: 20 },
  state: {},
};

describe("table actions (pure + immutable)", () => {
  it("moveObject updates position without mutating input", () => {
    const t = createTable();
    const before = JSON.stringify(t);
    const next = moveObject(t, "pawn-1", { zone: "city-9", x: 1, y: 2 });
    expect(JSON.stringify(t)).toBe(before); // input untouched
    expect(next).not.toBe(t);
    expect(next.objects.find((o) => o.id === "pawn-1")?.position).toEqual({
      zone: "city-9",
      x: 1,
      y: 2,
    });
  });

  it("addObject appends a piece", () => {
    const t = createTable();
    const next = addObject(t, sampleObject);
    expect(next.objects).toHaveLength(t.objects.length + 1);
    expect(next.objects.at(-1)).toEqual(sampleObject);
  });

  it("removeObject drops the piece and its deck reference", () => {
    const t = createTable();
    const id = t.decks.player[0];
    const next = removeObject(t, id);
    expect(next.objects.find((o) => o.id === id)).toBeUndefined();
    expect(next.decks.player).not.toContain(id);
  });

  it("updateObjectState merges (flip via faceUp)", () => {
    const t = createTable();
    const id = t.decks.player[0];
    const next = updateObjectState(t, id, { faceUp: true });
    expect(next.objects.find((o) => o.id === id)?.state.faceUp).toBe(true);
  });

  it("drawFromDeck pops the top id (end of array)", () => {
    const t = createTable();
    const top = t.decks.player.at(-1)!;
    const { table, drawnId } = drawFromDeck(t, "player");
    expect(drawnId).toBe(top);
    expect(table.decks.player).toHaveLength(t.decks.player.length - 1);
  });

  it("drawFromDeck returns null for empty/missing deck", () => {
    const t = createTable();
    expect(drawFromDeck(t, "infection").drawnId).toBeNull();
    expect(drawFromDeck(t, "nope").drawnId).toBeNull();
  });

  it("shuffleDeck is deterministic for a fixed seed", () => {
    const t = createTable();
    const a = shuffleDeck(t, "player", 42).decks.player;
    const b = shuffleDeck(t, "player", 42).decks.player;
    expect(a).toEqual(b);
    // same multiset, (very likely) different order
    expect([...a].sort()).toEqual([...t.decks.player].sort());
  });

  it("shuffleDeck differs across seeds", () => {
    const t = createTable();
    const a = shuffleDeck(t, "player", 1).decks.player;
    const b = shuffleDeck(t, "player", 2).decks.player;
    expect(a).not.toEqual(b);
  });
});

describe("persistence JSON round-trip", () => {
  it("exportJson -> importJson returns an equal tree", () => {
    const data = createSaveData();
    const restored = importJson(exportJson(data));
    expect(restored).toEqual(data);
  });

  it("importJson rejects bad input", () => {
    expect(() => importJson("not json")).toThrow();
    expect(() => importJson(JSON.stringify({ version: 999 }))).toThrow();
  });
});
