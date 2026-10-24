import assert from "node:assert/strict";
import { test } from "vitest";
import { buildPageRegistry } from "../../dist/registry/registry.js";
import { createContentManifest } from "../../dist/content/manifest.js";

test("canonical manifest combines route and heading metadata in registry order", () => {
  const registry = buildPageRegistry({
    docs: [
      { file: "02-disabled/page.mdx", frontmatter: { navigation: "disabled" } },
      {
        file: "01-guide/page.mdx",
        frontmatter: { title: "Guide", navigation: "hidden" },
      },
      { file: "page.mdx", frontmatter: { title: "Docs" } },
    ],
  });
  const headings = {
    "docs/01-guide/page.mdx": [{ id: "overview", value: "Overview", depth: 2 }],
  };
  const manifest = createContentManifest({ registry, headings });
  assert.deepEqual(
    manifest.map((page) => page.path),
    ["/docs", "/docs/guide"],
  );
  assert.deepEqual(manifest[0].headings, []);
  assert.deepEqual(manifest[1].headings, headings["docs/01-guide/page.mdx"]);
  assert.equal(manifest[1].navigation, "hidden");
  assert.equal(
    manifest.some((page) => page.path === "/docs/disabled"),
    false,
  );
});

test("manifest entries use registry paths and preserve visibility across collections", () => {
  const registry = buildPageRegistry({
    docs: [
      { file: "page.mdx", frontmatter: { title: "Documentation" } },
      { file: "01-guide/page.mdx", frontmatter: { navigation: "hidden" } },
    ],
    api: [
      { file: "page.mdx", frontmatter: { title: "API" } },
      { file: "01-internal/page.mdx", frontmatter: { navigation: "disabled" } },
    ],
  });
  const manifest = createContentManifest({ registry, headings: {} });
  assert.deepEqual(
    new Set(manifest.map((entry) => entry.path)),
    new Set(["/docs", "/docs/guide", "/api"]),
  );
  assert.equal(
    manifest.find((entry) => entry.path === "/docs/guide")?.navigation,
    "hidden",
  );
  assert.deepEqual(
    manifest.find((entry) => entry.path === "/api")?.headings,
    [],
  );
});

test("duplicate normalized slugs include both source file names", () => {
  assert.throws(
    () =>
      buildPageRegistry({
        docs: [{ file: "01-guide/page.mdx" }, { file: "02-guide/page.mdx" }],
      }),
    /Duplicate route \/docs\/guide: docs\/01-guide\/page\.mdx and docs\/02-guide\/page\.mdx/,
  );
});
