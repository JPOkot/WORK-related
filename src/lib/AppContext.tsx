"use client";

import React, { createContext, useContext } from "react";
import { useAppStore } from "./store";

type AppStoreType = ReturnType<typeof useAppStore>;

const AppContext = createContext<AppStoreType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const store = useAppStore();
  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

export function useApp(): AppStoreType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
