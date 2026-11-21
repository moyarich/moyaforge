import type { ReactNode } from "react";

/** Source content for a single CodeGroup tab. */
export interface CodeTabProps {
  label: string;
  children: ReactNode;
}

export function CodeTab({ children }: CodeTabProps) {
  return <>{children}</>;
}
