import React from "react";
import { createRoot } from "react-dom/client";
import { DocsLayout } from "@moyarich/moyaforge";
import { getTableOfContents } from "@moyarich/moyaforge-mdx/toc";

const toc = getTableOfContents([
  { id: "overview", value: "Overview", depth: 2 },
]);

createRoot(document.getElementById("root")).render(
  <DocsLayout pages={[]} toc={{ ...toc.options, headings: toc.headings }}>
    <article>
      <h2 id="overview">Overview</h2>
      <p>Consumer build fixture</p>
    </article>
  </DocsLayout>,
);
