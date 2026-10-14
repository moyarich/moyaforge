import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsLayout } from "../dist/components/DocsLayout/DocsLayout.js";
import { DocOutline } from "../dist/components/DocOutline/DocOutline.js";

const headings = [
  {
    id: "intro",
    value: "Intro",
    depth: 1,
    children: [
      {
        id: "setup",
        value: "Setup",
        depth: 2,
        children: [{ id: "options", value: "Options", depth: 3 }],
      },
    ],
  },
];
const render = (toc) =>
  renderToStaticMarkup(
    React.createElement(DocsLayout, {
      pages: [],
      children: React.createElement("article", null, "Body"),
      toc,
    }),
  );

test("metadata headings render links with exact extracted anchor IDs", () => {
  const html = render({ headings, placement: "right" });
  assert.match(html, /href="#setup"/);
  assert.match(html, /href="#options"/);
  assert.doesNotMatch(html, /href="#intro"/);
  assert.equal((html.match(/href="#setup"/g) ?? []).length, 1);
});

test("TOC placements never duplicate output and false removes the outline", () => {
  for (const placement of ["right", "sidebar", "inline"]) {
    const html = render({ headings, placement });
    assert.equal((html.match(/href="#setup"/g) ?? []).length, 1);
  }
  assert.doesNotMatch(render(false), /data-moyaforge-doc-outline/);
  assert.doesNotMatch(
    render({ headings, placement: "none" }),
    /data-moyaforge-doc-outline/,
  );
  assert.doesNotMatch(render({ headings: [] }), /data-moyaforge-doc-outline/);
});

test("collapsible outline starts closed if configured", () => {
  const html = renderToStaticMarkup(
    React.createElement(DocOutline, {
      headings: headings[0].children,
      collapsible: true,
      defaultOpen: false,
    }),
  );
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /href="#setup"/);
});

test("default DocsLayout navigation excludes hidden and disabled pages", () => {
  const pages = [
    { url: "/hidden", title: "Hidden", frontmatter: { navigation: "hidden" } },
    {
      url: "/disabled",
      title: "Disabled",
      frontmatter: { navigation: "disabled" },
    },
    {
      url: "/legacy-hidden",
      title: "Legacy Hidden",
      frontmatter: { hidden: true },
    },
    {
      url: "/visible",
      title: "Visible",
      frontmatter: { navigation: "visible" },
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(DocsLayout, {
      pages,
      currentUrl: "/hidden",
      children: React.createElement(
        "article",
        null,
        "Hidden route remains renderable",
      ),
    }),
  );
  assert.match(html, /href="\/visible"/);
  assert.doesNotMatch(html, /href="\/hidden"/);
  assert.doesNotMatch(html, /href="\/disabled"/);
  assert.doesNotMatch(html, /href="\/legacy-hidden"/);
  assert.match(html, /Hidden route remains renderable/);
});

test("TOC placements render in the intended landmark with a single accessible label", () => {
  for (const placement of ["right", "sidebar", "inline"]) {
    const html = render({
      headings,
      placement,
      label: "Article sections",
      minDepth: 2,
      maxDepth: 2,
    });
    const section = placement === "sidebar"
      ? /<aside data-moyaforge-docs-sidebar=""[\s\S]*?<\/aside>/
      : placement === "inline"
        ? /<main data-moyaforge-docs-article=""[\s\S]*?<\/main>/
        : /<aside data-moyaforge-doc-outline=""[\s\S]*?<\/aside>/;
    const region = html.match(section)?.[0] ?? "";
    assert.match(region, /aria-label="Article sections"/);
    assert.match(region, /href="#setup"/);
    assert.doesNotMatch(html, /href="#options"/);
    assert.equal((html.match(/aria-label="Article sections"/g) ?? []).length, 2);
  }
});

test("preserves canonical duplicate-heading slugs rather than regenerating them", () => {
  const duplicateSlugs = [
    { id: "overview", value: "Overview", depth: 2 },
    { id: "overview-1", value: "Overview", depth: 2 },
  ];
  const html = render({ headings: duplicateSlugs, placement: "right" });
  assert.match(html, /href="#overview"/);
  assert.match(html, /href="#overview-1"/);
  assert.equal((html.match(/>Overview<\/a>/g) ?? []).length, 2);
});
