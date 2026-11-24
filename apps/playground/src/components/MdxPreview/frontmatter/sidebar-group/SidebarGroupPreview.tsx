import "./SidebarGroupPreview.css";
import { useState, type MouseEvent, type ReactNode } from "react";
import { buildDocumentationGroups } from "../../../../../../../packages/moyaforge-mdx/src/navigation/tree/index.js";
import { SidebarV1 } from "../../../../../../../packages/moyaforge-ui/src/components/SidebarV1/index.js";
import type { FrontmatterDemo } from "../frontmatter-demo.js";

/** Render the real sidebar from this example's isolated registry. */
export function SidebarGroupPreview({
  registry,
  currentPath: controlledPath,
  onNavigate,
  outline,
}: Pick<FrontmatterDemo, "registry"> & {
  currentPath?: string;
  outline?: ReactNode;
  onNavigate?: (path: string) => void;
}) {
  const [currentPath, setCurrentPath] = useState("/docs/installation");
  const groups = buildDocumentationGroups(registry.routes, {
    docs: { navigation: { label: "Documentation" } },
  });

  function selectPage(event: MouseEvent<HTMLElement>) {
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    const path = link?.getAttribute("href");
    if (!path || !registry.byPath.has(path)) return;
    event.preventDefault();
    if (onNavigate) onNavigate(path);
    else setCurrentPath(path);
  }

  return (
    <SidebarV1
      className="mf-sidebar sidebar-frontmatter-result"
      groups={groups}
      outline={outline}
      currentUrl={
        controlledPath ??
        (registry.byPath.has(currentPath)
          ? currentPath
          : (registry.routes.find(
              (page) => page.file === "01-installation/page.md",
            )?.path ?? "/docs"))
      }
      onClickCapture={selectPage}
    />
  );
}
