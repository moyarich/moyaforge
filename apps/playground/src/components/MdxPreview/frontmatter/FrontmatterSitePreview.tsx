import { useState } from "react";
import { VirtualPage } from "../VirtualPage.js";
import { SidebarGroupPreview } from "./sidebar-group/SidebarGroupPreview.js";
import type { FrontmatterDemo } from "./frontmatter-demo.js";

/** Pair registry navigation with the selected document's compiled body. */
export function FrontmatterSitePreview({
  files,
  registry,
  initialFile = "01-installation/page.md",
}: Pick<FrontmatterDemo, "registry"> & {
  files: Readonly<Record<string, string>>;
  initialFile?: string;
}) {
  const [requestedPath, setRequestedPath] = useState<string>();
  const page =
    (requestedPath ? registry.byPath.get(requestedPath) : undefined) ??
    registry.routes.find((candidate) => candidate.file === initialFile) ??
    registry.routes[0];
  if (!page) return <p>No routable pages.</p>;
  const filename = `${page.source}/${page.file}`;
  return (
    <div className="frontmatter-site-preview">
      <SidebarGroupPreview
        registry={registry}
        currentPath={page.path}
        onNavigate={setRequestedPath}
      />
      <article
        className="frontmatter-site-article"
        aria-label="Virtual page content"
      >
        <p className="frontmatter-caption">{filename}</p>
        <VirtualPage filename={filename} source={files[filename]} />
      </article>
    </div>
  );
}
