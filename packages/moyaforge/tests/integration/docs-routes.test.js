import { test } from "vitest";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsRoutes } from "../../../dist/components/DocsRoutes/DocsRoutes.js";
import { createMoyaForgeSource } from "../../../dist/utils/content/index.js";

const source = createMoyaForgeSource({
  docs: {
    dir: "docs",
    baseUrl: "/docs",
    modules: {
      "page.mdx": {
        default: () => React.createElement("article", null, "Docs home"),
        frontmatter: { title: "Docs home" },
      },
      "01-guide/page.mdx": {
        default: () => React.createElement("article", null, "Guide content"),
        frontmatter: { title: "Guide" },
      },
      "02-hidden/page.mdx": {
        default: () => React.createElement("article", null, "Hidden content"),
        frontmatter: { title: "Hidden", navigation: "hidden" },
      },
      "03-disabled/page.mdx": {
        default: () => React.createElement("article", null, "Disabled content"),
        frontmatter: { title: "Disabled", navigation: "disabled" },
      },
    },
  },
});

const render = (pathname, extras = {}) =>
  renderToStaticMarkup(
    React.createElement(DocsRoutes, { source, pathname, ...extras }),
  );

test("host-provided paths resolve nested routes with or without trailing slashes", () => {
  for (const pathname of ["/docs/guide", "/docs/guide/"]) {
    const html = render(pathname);
    assert.match(html, /Guide content/);
    assert.match(html, /href="\/docs\/guide" aria-current="page"/);
  }
});

test("hidden pages stay renderable without appearing in the default navigation", () => {
  const html = render("/docs/hidden");
  assert.match(html, /Hidden content/);
  assert.doesNotMatch(html, /href="\/docs\/hidden"/);
  assert.doesNotMatch(html, /href="\/docs\/disabled"/);
});

test("disabled and unknown pages use the host-provided not-found view", () => {
  for (const pathname of ["/docs/disabled", "/docs/unknown"]) {
    const html = render(pathname, {
      notFound: React.createElement("p", null, "Host 404"),
    });
    assert.match(html, /Host 404/);
    assert.doesNotMatch(html, /Disabled content/);
  }
});

test("host renderPage overrides the default route content", () => {
  const html = render("/docs/guide", {
    renderPage: (page) =>
      React.createElement("strong", null, page.title + " override"),
  });
  assert.match(html, /Guide override/);
  assert.doesNotMatch(html, /Guide content/);
});

test("host app keeps unrelated routes outside the embedded documentation", () => {
  function HostApp({ pathname }) {
    if (!pathname.startsWith("/docs"))
      return React.createElement("main", null, "Host dashboard");
    return React.createElement(DocsRoutes, {
      source,
      pathname,
      notFound: React.createElement("p", null, "Docs not found"),
    });
  }
  const renderHost = (pathname) =>
    renderToStaticMarkup(React.createElement(HostApp, { pathname }));
  assert.match(renderHost("/dashboard"), /Host dashboard/);
  assert.doesNotMatch(renderHost("/dashboard"), /Docs not found/);
  assert.match(renderHost("/docs/guide"), /Guide content/);
  assert.match(renderHost("/docs/missing"), /Docs not found/);
});

test("embedded docs allow consumers to override shell content without replacing routing", () => {
  const html = render("/docs/guide", {
    layout: {
      title: "Host documentation",
      header: React.createElement("strong", null, "Host header"),
      footer: React.createElement("small", null, "Host footer"),
    },
  });
  assert.match(html, /Host header/);
  assert.match(html, /Host footer/);
  assert.match(html, /Guide content/);
});
