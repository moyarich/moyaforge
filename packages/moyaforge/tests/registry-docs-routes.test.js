import { test, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { RegistryDocsRoutes } from "../dist/components/Routing/RegistryDocsRoutes.js";

const routes = [
  { path: "/docs/guide", source: "docs", file: "guide/page.mdx", navigation: "visible" },
  { path: "/docs/hidden", source: "docs", file: "hidden/page.mdx", navigation: "hidden" },
  { path: "/docs/disabled", source: "docs", file: "disabled/page.mdx", navigation: "disabled" },
];
const loader = () => Promise.resolve({ default: () => React.createElement("h1", null, "Guide") });
const sources = { docs: { lazyPages: {
  "guide/page.mdx": loader,
  "hidden/page.mdx": loader,
  "disabled/page.mdx": loader,
} } };
function render(path, props = {}) {
  return renderToString(
    React.createElement(MemoryRouter, { initialEntries: [path] },
      React.createElement(RegistryDocsRoutes, { routes, sources, ...props })),
  );
}

test("registered pages render lazily without per-page React routes", () => {
  expect(render("/docs/guide")).toContain("Loading documentation");
  expect(render("/docs/hidden")).toContain("Loading documentation");
  expect(render("/docs/guide/")).toContain("Loading documentation");
});

test("disabled, missing and unregistered routes are not accessible", () => {
  expect(render("/docs/disabled")).toContain("Page not found");
  expect(render("/docs/missing")).toContain("Page not found");
  expect(render("/host")).toContain("Page not found");
});

test("consumers can use metadata to customize the page shell", () => {
  const html = render("/docs/guide", {
    renderPage: (page, content) => React.createElement("main", { "data-page": page.path }, content),
  });
  expect(html).toContain('data-page="/docs/guide"');
});
