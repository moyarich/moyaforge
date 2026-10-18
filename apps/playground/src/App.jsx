import { useCallback, useEffect, useMemo } from "react";
import { HashRouter, useLocation, useNavigate } from "react-router-dom";
import { DocumentationSite } from "../../../packages/moyaforge-ui/src/components/Layout/DocumentationSite/DocumentationSite.tsx";
import {
  SidebarV1,
  Navigation,
} from "../../../packages/moyaforge-ui/src/components/SidebarV1/index.ts";
import {
  DocOutlineShell,
  DocOutline,
} from "../../../packages/moyaforge-ui/src/components/DocOutline/index.ts";
import { buildDocumentationGroups } from "@moyarich/moyaforge-mdx/navigation";
import { RegistryRoutes } from "@moyarich/moyaforge/registry-routes";
import registry from "../registry.config.ts";
import { VersionPicker } from "./components/Shell/VersionPicker.jsx";
import { Feedback } from "./components/Shell/Feedback.jsx";
import { getTableOfContents } from "@moyarich/moyaforge-mdx/toc";
import { routes, headings } from "virtual:moyaforge-mdx/metadata";
import { searchPages } from "@moyarich/moyaforge-search-sqlite/client";

function PlaygroundShell() {
  const { pathname } = useLocation();
  const page = routes.find(
    (item) =>
      item.path === (pathname.replace(/\/+$/, "") || "/") &&
      item.navigation !== "disabled",
  );
  const navigate = useNavigate();
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
        })),
    [],
  );
  const pagesByKey = useMemo(
    () => new Map(routes.map((item) => [`${item.source}/${item.file}`, item])),
    [],
  );
  const search = useCallback(
    async (query) =>
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
        <SidebarV1 header={<VersionPicker />}>
          <Navigation groups={groups} />
        </SidebarV1>
      }
      outline={
        toc && toc.options.placement !== "none" ? (
          <DocOutlineShell footer={<Feedback page={page} />}>
            <DocOutline
              key={page.path}
              headings={toc.headings}
              title={toc.options.label}
              collapsible={toc.options.collapsible}
              defaultOpen={toc.options.defaultOpen}
            />
          </DocOutlineShell>
        ) : null
      }
    >
      <RegistryRoutes notFound={<h1>Page not found</h1>} />
    </DocumentationSite>
  );
}
export function App() {
  return (
    <HashRouter>
      <PlaygroundShell />
    </HashRouter>
  );
}
