import React from "react";
import { createRoot } from "react-dom/client";
import {
  DocsLayout,
  DocsRoutes,
  createMoyaForgeSource,
} from "@moyarich/moyaforge";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { getTableOfContents } from "@moyarich/moyaforge-mdx/toc";

const toc = getTableOfContents([
  { id: "overview", value: "Overview", depth: 2 },
  { id: "overview-1", value: "Overview", depth: 2 },
]);

const hostSource = createMoyaForgeSource({
  docs: {
    dir: "docs",
    baseUrl: "/docs",
    modules: {
      "guide/page.mdx": {
        default: () => (
          <article>
            <h1>Embedded guide</h1>
          </article>
        ),
        frontmatter: { title: "Embedded guide" },
      },
    },
  },
});

function HostDocs() {
  const pathname = window.location.pathname;
  return (
    <DocsRoutes
      source={hostSource}
      pathname={pathname}
      notFound={<p>Embedded docs not found</p>}
    />
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
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
  </BrowserRouter>,
);
