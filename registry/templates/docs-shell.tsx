import type { ReactNode } from "react";
import {
  DocsLayout,
  type DocsLayoutProps,
} from "./components/Layout/DocsLayout/DocsLayout.js";

/** Editable documentation shell using the canonical UI layout.
 * Host applications own routing, content discovery and page metadata.
 */
export function DocsShell({
  children,
  pages,
  currentUrl,
  ...layout
}: DocsLayoutProps & { children: ReactNode }) {
  return (
    <DocsLayout pages={pages} currentUrl={currentUrl} {...layout}>
      {children}
    </DocsLayout>
  );
}
