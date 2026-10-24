import React from "react";
import { DocsLayout } from "../../packages/moyaforge-ui/src/components/Layout/DocsLayout/index.ts";
const headings = [
  { id: "first-section", text: "First section", depth: 2 },
  { id: "second-section", text: "Second section", depth: 2 },
];

/** Exercise the real layout with canonical heading metadata in a host router. */
export function TocRouterFixture() {
  return (
    <DocsLayout pages={[]} toc={{ placement: "right", headings }}>
      <article>
        <h1>TOC router integration fixture</h1>
        <h2 id="first-section" tabIndex={-1}>
          First section
        </h2>
        <p>First heading content</p>
        <h2 id="second-section" tabIndex={-1}>
          Second section
        </h2>
        <p>Second heading content</p>
      </article>
    </DocsLayout>
  );
}
