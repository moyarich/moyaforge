import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("content query routing respects normalized routable pages", async () => {
  const source = await readFile(
    new URL("../src/content-routing.js", import.meta.url),
    "utf8",
  );
  const standalone = source.replace(
    'import { routes } from "virtual:moyaforge-mdx/metadata";',
    'const routes = [{ path: "/docs", navigation: "visible" }, { path: "/docs/hidden", navigation: "hidden" }];',
  );
  const router = await import(
    "data:text/javascript," + encodeURIComponent(standalone)
  );
  assert.equal(router.firstContentRoute(), "/docs");
  assert.equal(router.normalizeRoute("/docs/"), "/docs");
  assert.equal(router.normalizeRoute("/docs/hidden"), "/docs/hidden");
  assert.equal(router.normalizeRoute("/docs/disabled"), null);
  assert.equal(router.normalizeRoute("//evil.test"), null);
  assert.equal(
    router.readContentRoute("?page=%2Fdocs%2Fhidden"),
    "/docs/hidden",
  );
  assert.equal(router.readContentRoute("?page=%2Fmissing"), null);
});

test("default content route never picks disabled pages", async () => {
  const source = await readFile(
    new URL("../src/content-routing.js", import.meta.url),
    "utf8",
  );
  const importLine = 'import { routes } from "virtual:moyaforge-mdx/metadata";';
  const load = async (routes) => {
    const standalone = source.replace(
      importLine,
      `const routes = ${JSON.stringify(routes)};`,
    );
    return import("data:text/javascript," + encodeURIComponent(standalone));
  };
  const hiddenOnly = await load([
    { path: "/docs/hidden", navigation: "hidden" },
  ]);
  assert.equal(hiddenOnly.firstContentRoute(), "/docs/hidden");
  const visiblePreferred = await load([
    { path: "/docs/hidden", navigation: "hidden" },
    { path: "/docs/start", navigation: "visible" },
  ]);
  assert.equal(visiblePreferred.firstContentRoute(), "/docs/start");
  const noRoutablePages = await load([]);
  assert.equal(noRoutablePages.firstContentRoute(), null);
});

test("SQLite search keys resolve only to canonical routable pages", async () => {
  const source = await readFile(
    new URL("../src/content-routing.js", import.meta.url),
    "utf8",
  );
  const standalone = source.replace(
    'import { routes } from "virtual:moyaforge-mdx/metadata";',
    `const routes = ${JSON.stringify([
      { source: "docs", file: "01-guide/page.mdx", path: "/docs/guide", navigation: "visible" },
      { source: "docs", file: "02-hidden/page.md", path: "/docs/hidden", navigation: "hidden" },
    ])};`,
  );
  const router = await import("data:text/javascript," + encodeURIComponent(standalone));
  assert.equal(router.searchResultRoute("docs/01-guide/page.mdx"), "/docs/guide");
  assert.equal(router.searchResultRoute("docs/02-hidden/page.md"), "/docs/hidden");
  assert.equal(router.searchResultRoute("docs/03-disabled/page.mdx"), null);
  assert.equal(router.searchResultRoute("README.md"), null);
});
