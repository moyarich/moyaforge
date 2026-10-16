import { lazy, Suspense, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DocumentationSite } from "../../../packages/moyaforge-ui/src/components/Layout/DocumentationSite/DocumentationSite.tsx";
import {
  SidebarV1,
  Navigation,
  DocOutlineShell,
  DocOutline,
  buildDocumentationGroups,
} from "@moyarich/moyaforge/docs";
import {
  MoyaForgeRouter,
  useContentRouting,
} from "@moyarich/moyaforge/headless";
import registry from "../registry.config.ts";
import { VersionPicker } from "./components/Shell/VersionPicker.jsx";
import { Feedback } from "./components/Shell/Feedback.jsx";
import { getTableOfContents } from "@moyarich/moyaforge-mdx/toc";
import { routes, headings } from "virtual:moyaforge-mdx/metadata";
import { sources } from "virtual:moyaforge-mdx/lazy-registry";
import { searchPages } from "@moyarich/moyaforge-search-sqlite/client";

const contentComponents = new Map();
function ContentPage() {
  const { page, routes, firstContentRoute } = useContentRouting();
  const loader = page && sources[page.source]?.lazyPages?.[page.file];
  if (loader && !contentComponents.has(loader))
    contentComponents.set(loader, lazy(loader));
  const Page = contentComponents.get(loader);
  useEffect(() => {
    document.title = `${page?.title ?? "Page not found"} | MoyaForge`;
  }, [page]);
  if (!Page)
    return (
      <>
        <h1>{routes.length ? "Page not found" : "No content configured"}</h1>
        <p>
          {routes.length
            ? "This page is not in the content registry."
            : "Add content sources in registry.config.ts to load documentation."}
        </p>
        {firstContentRoute() && (
          <Link to={firstContentRoute()}>Return to documentation</Link>
        )}
      </>
    );
  return (
    <Suspense fallback={<p role="status">Loading documentation…</p>}>
      <Page key={page.path} />
    </Suspense>
  );
}
function PlaygroundShell() {
  const { page } = useContentRouting();
  const navigate = useNavigate();
  const groups = buildDocumentationGroups(routes, registry.sources);
  const toc = page
    ? getTableOfContents(
        headings[`${page.source}/${page.file}`] ?? [],
        page.toc,
      )
    : null;
  return (
    <DocumentationSite
      title="MoyaForge"
      pages={routes
        .filter((item) => item.navigation !== "disabled")
        .map((item) => ({
          path: item.path,
          label: item.label ?? item.title,
          source: item.source,
        }))}
      currentPath={page?.path}
      onNavigate={navigate}
      repository="https://github.com/moyarich/moyaforge"
      search={async (query) =>
        (await searchPages(query)).flatMap((key) => {
          const match = routes.find(
            (item) => `${item.source}/${item.file}` === key,
          );
          return match
            ? [
                {
                  path: match.path,
                  label: match.label ?? match.title,
                  source: match.source,
                },
              ]
            : [];
        })
      }
      sidebar={
        <SidebarV1 header={<VersionPicker />}>
          <Navigation groups={groups} />
        </SidebarV1>
      }
      outline={
        toc && toc.options.placement !== "none" ? (
          <DocOutlineShell footer={<Feedback />}>
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
      <ContentPage />
    </DocumentationSite>
  );
}
export function App() {
  return (
    <MoyaForgeRouter pages={routes} mode="hash">
      <PlaygroundShell />
    </MoyaForgeRouter>
  );
}
