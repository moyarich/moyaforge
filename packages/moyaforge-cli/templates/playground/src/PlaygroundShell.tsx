import { useMemo, type PropsWithChildren } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { NormalizedPage } from "@moyarich/moyaforge-mdx";
import { buildDocumentationGroups } from "@moyarich/moyaforge-mdx/navigation";
import { getTableOfContents } from "@moyarich/moyaforge-mdx/toc";
import { routes, headings } from "virtual:moyaforge-mdx/metadata";
import { DocumentationSite } from "__UI__/Layout/DocumentationSite/index.js";
import { SidebarV1, Navigation } from "__UI__/SidebarV1/index.js";
import { DocOutline, DocOutlineShell } from "__UI__/DocOutline/index.js";
import registry from "../registry.config.js";
import { SearchAdapter } from "./SearchAdapter.js";

export function PlaygroundShell({
  page,
  children,
}: PropsWithChildren<{ page?: NormalizedPage }>) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const groups = useMemo(() => buildDocumentationGroups(routes, registry.sources), []);
  const pages = useMemo(() => routes
    .filter(item => item.navigation === "visible")
    .map(item => ({
      path: item.path,
      label: item.label ?? item.title,
      source: item.source,
      sourcePath: item.sourcePath,
    })), []);
  const toc = page
    ? getTableOfContents(headings[`${page.source}/${page.file}`] ?? [], page.toc)
    : null;
  return (
    <DocumentationSite
      title="My Playground"
      pages={pages}
      currentPath={page?.path}
      onNavigate={navigate}
      onSearch={SearchAdapter}
      sidebar={<SidebarV1><Navigation groups={groups} /></SidebarV1>}
      outline={page && toc && toc.options.placement !== "none" ? (
        <DocOutlineShell>
          <DocOutline
            key={page.path}
            headings={toc.headings}
            title={toc.options.label}
            collapsible={toc.options.collapsible}
            defaultOpen={toc.options.defaultOpen}
            renderLink={(item, active) => (
              <a href={`#${pathname}#${encodeURIComponent(item.id)}`}
                aria-current={active ? "location" : undefined}>{item.label}</a>
            )}
          />
        </DocOutlineShell>
      ) : null}
    >
      {children}
    </DocumentationSite>
  );
}
