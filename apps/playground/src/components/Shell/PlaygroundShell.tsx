import { useCallback, useEffect, useMemo, type PropsWithChildren } from "react";
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
import type { NormalizedPage } from "@moyarich/moyaforge-mdx";
import { buildDocumentationGroups } from "@moyarich/moyaforge-mdx/navigation";
import registry from "../../../registry.config.ts";
import { PlaygroundVersionPicker } from "./PlaygroundVersionPicker.tsx";
import { Feedback } from "./Feedback.tsx";
import { getTableOfContents } from "@moyarich/moyaforge-mdx/toc";
import { routes, headings } from "virtual:moyaforge-mdx/metadata";
import { searchPages } from "@moyarich/moyaforge-search-sqlite/client";

export function PlaygroundShell({
  page,
  children,
}: PropsWithChildren<{ page?: NormalizedPage }>) {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!hash) return;
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      id = hash.slice(1);
    }
    const frame = requestAnimationFrame(() => {
      const heading = document.getElementById(id);
      if (!heading) return;
      heading.scrollIntoView();
      if (!heading.hasAttribute("tabindex"))
        heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  useEffect(() => {
    document.title = `${page?.title ?? "Page not found"} | MoyaForge`;
  }, [page]);
  const groups = useMemo(
    () => buildDocumentationGroups(routes, registry.sources),
    [],
  );
  const visiblePages = useMemo(
    () =>
      routes
        .filter((item) => item.navigation === "visible")
        .map((item) => ({
          path: item.path,
          label: item.label ?? item.title,
          source: item.source,
          sourcePath: item.sourcePath,
        })),
    [],
  );
  const pagesByKey = useMemo(
    () => new Map(routes.map((item) => [`${item.source}/${item.file}`, item])),
    [],
  );
  const search = useCallback(
    async (query: string) =>
      (await searchPages(query)).flatMap((key) => {
        const match = pagesByKey.get(key);
        return match
          ? [
              {
                path: match.path,
                label: match.label ?? match.title,
                source: match.source,
              },
            ]
          : [];
      }),
    [pagesByKey],
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
      pages={visiblePages}
      currentPath={page?.path}
      onNavigate={navigate}
      repository="https://github.com/moyarich/moyaforge"
      search={search}
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
