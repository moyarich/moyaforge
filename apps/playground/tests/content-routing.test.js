import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("content query routing respects normalized routable pages", async () => {
  const source = await readFile(
    new URL("../src/content-routing.js", import.meta.url),
    "utf8",
  );
  const standalone = source.replace(
    'import { pages, routes } from "virtual:moyaforge-mdx/metadata";',
    'const pages = [{ path: "/docs", navigation: "visible" }]; const routes = [{ path: "/docs" }, { path: "/docs/hidden" }];',
  );
  const router = await import(
    "data:text/javascript," + encodeURIComponent(standalone)
  );
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
