// React wiring around the reducer: provides { state, dispatch } and autosaves
// to localStorage on every change. On mount it hydrates from a saved blob if
// one exists, otherwise starts a fresh campaign.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
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

  // Autosave, debounced so rapid-fire actions (drags, hovers-turned-clicks)
  // don't each force a synchronous full-state serialize+write.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(state), 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state]);

  // Flush any pending save when the tab is hidden/closed.
  useEffect(() => {
    const flush = () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      save(state);
    };
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
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
