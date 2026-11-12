import { createContext, useContext } from "react";

export type View = "preview" | "code";
export interface PreviewState {
  view: View;
  setView: (view: View) => void;
  contentId: string;
  source?: string;
}
export const PreviewContext = createContext<PreviewState | null>(null);
export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context)
    throw new Error("Preview slots must be rendered inside <Preview>.");
  return context;
}
