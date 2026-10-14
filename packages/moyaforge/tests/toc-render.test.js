import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsLayout, DocOutline } from "../dist/index.js";

const headings = [{ id: "intro", value: "Intro", depth: 1, children: [
  { id: "setup", value: "Setup", depth: 2, children: [
    { id: "options", value: "Options", depth: 3 },
  ] },
] }];
const render = (toc) => renderToStaticMarkup(React.createElement(DocsLayout, {
  pages: [], children: React.createElement("article", null, "Body"), toc,
}));

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
  assert.doesNotMatch(render({ headings, placement: "none" }), /data-moyaforge-doc-outline/);
  assert.doesNotMatch(render({ headings: [] }), /data-moyaforge-doc-outline/);
});

test("collapsible outline starts closed if configured", () => {
  const html = renderToStaticMarkup(React.createElement(DocOutline, {
    headings: headings[0].children, collapsible: true, defaultOpen: false,
  }));
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /href="#setup"/);
});
