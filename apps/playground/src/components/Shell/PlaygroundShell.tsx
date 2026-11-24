import { useEffect, useMemo, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DocumentationSite } from "../../../../../packages/moyaforge-ui/src/components/Layout/DocumentationSite/DocumentationSite.tsx";
import {
  SidebarV1,
  Navigation,
} from "../../../../../packages/moyaforge-ui/src/components/SidebarV1/index.ts";
import {
  DocOutlineShell,
  DocOutline,
} from "../../../../../packages/moyaforge-ui/src/components/DocOutline/index.ts";
import type { RegistryPage } from "@moyarich/moyaforge-mdx";
import { createContentRouting } from "@moyarich/moyaforge/headless";
import { buildDocumentationGroups } from "@moyarich/moyaforge-mdx/navigation";
import registry from "../../../registry.config.ts";
import { PlaygroundVersionPicker } from "./PlaygroundVersionPicker.tsx";
import { Feedback } from "./Feedback.tsx";
import { getTableOfContents } from "@moyarich/moyaforge-mdx/toc";
import { routes, headings } from "virtual:moyaforge-mdx/metadata";
import { searchPages } from "@moyarich/moyaforge-search-sqlite/client";

const contentRouting = createContentRouting(routes);

async function findMatchingPages(query: string) {
  return contentRouting
    .searchResultPages(await searchPages(query))
    .map((page) => ({
      path: page.path,
      label: page.title,
      source: page.source,
      sourcePath: page.sourcePath,
    }));
}

export function PlaygroundShell({
  page,
  children,
}: PropsWithChildren<{ page?: RegistryPage }>) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = `${page?.title ?? "Page not found"} | MoyaForge`;
  }, [page]);
  const groups = useMemo(
    () => buildDocumentationGroups(routes, registry.sources),
    [],
  );
  const toc = page
    ? getTableOfContents(
        headings[`${page.source}/${page.file}`] ?? [],
        page.toc,
      )
    : null;
  return (
    <DocumentationSite
      title="MoyaForge"
      pages={routes}
      currentPath={page?.path}
      onNavigate={navigate}
      repository="https://github.com/moyarich/moyaforge"
      onSearch={findMatchingPages}
      sidebar={
        <SidebarV1 header={<PlaygroundVersionPicker />}>
          <Navigation groups={groups} />
        </SidebarV1>
      }
      outline={
        page && toc && toc.options.placement !== "none" ? (
          <DocOutlineShell footer={<Feedback page={page} />}>
            <DocOutline
              key={page.path}
              headings={toc.headings}
              title={toc.options.label}
              collapsible={toc.options.collapsible}
              defaultOpen={toc.options.defaultOpen}
              renderLink={(item, active) => (
                <a
                  href={`#${pathname}#${encodeURIComponent(item.id)}`}
                  aria-current={active ? "location" : undefined}
                >
                  {item.label}
                </a>
              )}
            />
          </DocOutlineShell>
        ) : null
      }
    >
      {children}
    </DocumentationSite>
  );
}
