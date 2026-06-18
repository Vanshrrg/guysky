// Persistence against localStorage (SPEC §8), plus JSON export/import for
// backup/sharing. The whole game is one SaveData blob, so this is thin.

import { SAVE_VERSION, type SaveData } from "./types";

export const STORAGE_KEY = "epidemic-legacy:save";

/** Minimal structural validation of a parsed blob. Throws on bad shape. */
function assertSaveData(value: unknown): asserts value is SaveData {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid save: not an object");
  }
  const v = value as Record<string, unknown>;
  if (typeof v.version !== "number") {
    throw new Error("Invalid save: missing version");
  }
  if (v.version !== SAVE_VERSION) {
    throw new Error(
      `Save version mismatch: file is v${v.version}, app expects v${SAVE_VERSION}`,
    );
  }
  if (typeof v.campaign !== "object" || v.campaign === null) {
    throw new Error("Invalid save: missing campaign");
  }
  // table may be null (no in-progress session snapshot).
}

/** Write the save blob to localStorage. */
export function save(data: SaveData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Load the save blob, or null if absent/corrupt. */
export function load(): SaveData | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    assertSaveData(parsed);
    return parsed;
  } catch (err) {
    console.warn("Failed to load save:", err);
    return null;
  }
}

/** Wipe the persisted save. */
export function reset(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("epidemic.hand-cards.v1");
}

/** Serialize a save blob to pretty JSON for download/copy. */
export function exportJson(data: SaveData): string {
  return JSON.stringify(data, null, 2);
}

/** Parse + validate JSON text back into a SaveData. Throws on bad input. */
export function importJson(text: string): SaveData {
  const parsed = JSON.parse(text);
  assertSaveData(parsed);
  return parsed;
}
