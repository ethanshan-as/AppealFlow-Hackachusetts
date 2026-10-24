"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Mode = "simple" | "advanced";

interface ModeContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);
const STORAGE_KEY = "appealflow:v1:mode";

export function ModeProvider({ children }: { children: React.ReactNode }) {
  // Simple mode is the default (P1 #5).
  const [mode, setModeState] = useState<Mode>("simple");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Mode | null;
      if (saved === "simple" || saved === "advanced") setModeState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    () => setMode(mode === "simple" ? "advanced" : "simple"),
    [mode, setMode]
  );

  return (
    <ModeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
