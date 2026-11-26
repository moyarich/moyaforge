import { createContext, useContext } from "react";

export interface TabsContextValue {
  value: string;
  select: (value: string) => void;
  id: string;
}
export const TabsContext = createContext<TabsContextValue | null>(null);
export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be rendered inside Tabs.");
  return context;
}
