import { createContext, useContext } from "react";

/** Mutually exclusive live and code views. */
export type View = "preview" | "code";
/** Shared view, output and source state consumed by preview slots. */
export interface PreviewState {
  view: View;
  setView: (view: View) => void;
  contentId: string;
  outputId: string;
  outputOpen: boolean;
  setOutputOpen: (open: boolean) => void;
  outputLabel: string;
  source?: string;
}
/** Context owned by the parent Preview component. */
export const PreviewContext = createContext<PreviewState | null>(null);
/** Read parent preview state; throws when a slot is used outside Preview. */
export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context)
    throw new Error("Preview slots must be rendered inside <Preview>.");
  return context;
}
