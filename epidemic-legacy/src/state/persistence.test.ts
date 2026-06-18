// @vitest-environment jsdom
// Exercises the real localStorage round-trip (save → load → reset), which the
// node-env action tests can't cover.

import { beforeEach, describe, expect, it } from "vitest";
import { createSaveData } from "./initialState";
import { load, reset, save, STORAGE_KEY } from "./persistence";

describe("localStorage persistence", () => {
  beforeEach(() => localStorage.clear());

  it("save then load returns an equal tree", () => {
    const data = createSaveData();
    save(data);
    expect(load()).toEqual(data);
  });

  it("load returns null when nothing is saved", () => {
    expect(load()).toBeNull();
  });

  it("reset clears the saved blob", () => {
    save(createSaveData());
    reset();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(load()).toBeNull();
  });

  it("load returns null on corrupt JSON instead of throwing", () => {
    localStorage.setItem(STORAGE_KEY, "{ not valid json");
    expect(load()).toBeNull();
  });
});
