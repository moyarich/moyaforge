import React, { lazy, Suspense } from "react";
import { TocRouterFixture } from "../fixtures/toc-router.jsx";
import { createRoot } from "react-dom/client";
import { createMoyaForgeSource } from "@moyarich/moyaforge";
import { HeadlessDocsRoutes } from "@moyarich/moyaforge/headless";
import { DocsLayout } from "../../packages/moyaforge-ui/src/components/Layout/DocsLayout/index.ts";
import { HighlightedCode } from "../../packages/moyaforge-ui/src/components/HighlightedCode/index.ts";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { getTableOfContents } from "@moyarich/moyaforge-mdx/toc";

const SharedMonacoFixture = lazy(async () => {
  const { initializeSharedMonaco } = await import(
    "@moyarich/moyaforge-monaco/shared"
  );
  await initializeSharedMonaco();
  return import("../fixtures/monaco-shared.jsx");
});

const toc = getTableOfContents([
  { id: "overview", value: "Overview", depth: 2 },
  { id: "overview-1", value: "Overview", depth: 2 },
]);

const hostSource = createMoyaForgeSource({
  docs: {
    dir: "docs",
    baseUrl: "/docs",
    modules: {
      "reference/page.mdx": {
        default: () => (
          <article>
            <h1>Embedded reference</h1>
            <Link to="/docs/guide">Back to guide</Link>
          </article>
        ),
        frontmatter: { title: "Reference" },
      },
      "guide/page.mdx": {
        default: () => (
          <article>
            <h1>Embedded guide</h1>
            <h2 id="installation">Installation</h2>
            <Link to="/docs/reference">Open reference</Link>
            <Link to="/host">Return to host</Link>
          </article>
        ),
        frontmatter: { title: "Guide" },
      },
    },
  },
});

function HostDocs() {
  const { pathname } = useLocation();
  return (
    <HeadlessDocsRoutes
      source={hostSource}
      pathname={pathname}
      notFound={<p>Embedded docs not found</p>}
    />
  );
}

const ConsumerRouter = new URLSearchParams(window.location.search).has(
  "hash-router",
)
  ? HashRouter
  : BrowserRouter;

createRoot(document.getElementById("root")).render(
  <ConsumerRouter basename="/app">
    <Routes>
      <Route
        path="/host"
        element={
          <main>
            <h1>Host dashboard</h1>
            <Link to="/docs/guide">Open docs</Link>
          </main>
        }
      />
      <Route path="/docs/*" element={<HostDocs />} />
      <Route
        path="/syntax"
        element={
          <main className="mf-docs">
            <article className="mf-article">
              <pre data-testid="embedded-css-preview">
                <HighlightedCode
                  language="mdx"
                  code={[
                    "<style>",
                    ".custom-block.ui-success {",
                    "  --mf-custom-block-bg: #e9f9f1;",
                    "  background-color: red;",
                    "}",
                    "</style>",
                  ].join("\n")}
                />
              </pre>
            </article>
          </main>
        }
      />
      <Route path="/toc-router" element={<TocRouterFixture />} />
      <Route
        path="/monaco-shared"
        element={
          <Suspense fallback={<p role="status">Loading Monaco fixture…</p>}>
            <SharedMonacoFixture />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <DocsLayout
            pages={[]}
            toc={{ ...toc.options, headings: toc.headings }}
          >
            <article>
              <h2 id="overview">Overview</h2>
              <p>Consumer build fixture</p>
              <h2 id="overview-1">Overview</h2>
              <p>Second section with a canonical duplicate-heading slug.</p>
            </article>
          </DocsLayout>
        }
      />
    </Routes>
  </ConsumerRouter>,
);
