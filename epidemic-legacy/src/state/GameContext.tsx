// React wiring around the reducer: provides { state, dispatch } and autosaves
// to localStorage on every change. On mount it hydrates from a saved blob if
// one exists, otherwise starts a fresh campaign.

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { createSaveData } from "./initialState";
import { load, save } from "./persistence";
import { gameReducer, type GameAction } from "./reducer";
import type { SaveData } from "./types";

interface GameContextValue {
  state: SaveData;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

/** Lazy initializer: prefer a persisted save, else a fresh campaign. */
function init(): SaveData {
  return load() ?? createSaveData();
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, init);

  // Autosave on every state change.
  useEffect(() => {
    save(state);
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
