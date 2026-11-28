import type { ReactNode } from "react";

/** Source content for a single CodeGroup tab. */
export interface CodeTabProps {
  /** Visible tab label. */
  label: string;
  /** Source content displayed when selected. */
  children: ReactNode;
}

/** Declare one direct child of CodeGroup, with a label and code content. */
export function CodeTab({ children }: CodeTabProps) {
  return <>{children}</>;
}
