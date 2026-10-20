import assert from "node:assert/strict";
import { test } from "vitest";
import { buildPageRegistry } from "../../dist/registry/registry.js";

test("discovers root and nested landing pages with path-derived labels and ordering", () => {
  const registry = buildPageRegistry({
    docs: [
      { file: "02-api/page.mdx" },
      { file: "page.md" },
      { file: "01-start/page.md", frontmatter: { title: "Quick start" } },
    ],
  });
  assert.deepEqual(
    registry.navigation.map((p) => p.path),
    ["/docs", "/docs/start", "/docs/api"],
  );
  assert.equal(registry.byPath.get("/docs/start").label, "Quick start");
  assert.deepEqual(
    registry.breadcrumbs("/docs/start").map((p) => p.path),
    ["/docs", "/docs/start"],
  );
});

test("hidden pages remain routable; disabled pages are excluded", () => {
  const registry = buildPageRegistry({
    docs: [
      { file: "page.mdx" },
      {
        file: "01-hidden/page.md",
        frontmatter: { navigation: "hidden", toc: false },
      },
      { file: "02-disabled/page.mdx", frontmatter: { navigation: "disabled" } },
    ],
  });
  assert.equal(registry.routes.length, 2);
  assert.equal(registry.navigation.length, 1);
  assert.equal(registry.byPath.get("/docs/hidden").toc, false);
  assert.equal(registry.byPath.has("/docs/disabled"), false);
});

test("colliding public paths and invalid metadata fail with source paths", () => {
  assert.throws(
    () =>
      buildPageRegistry({
        docs: [{ file: "01-api/page.md" }, { file: "02-api/page.mdx" }],
      }),
    /Duplicate route \/docs\/api/,
  );
  assert.throws(
    () =>
      buildPageRegistry({
        docs: [
          {
            file: "page.md",
            frontmatter: { toc: { minDepth: 4, maxDepth: 2 } },
          },
        ],
      }),
    /page.md: toc minDepth exceeds maxDepth/,
  );
});

test("project TOC configuration is validated even for empty sources", () => {
  assert.throws(
    () => buildPageRegistry({ docs: [] }, { toc: { placement: "left" } }),
    /registry\.config\.ts: invalid toc placement/,
  );
  assert.throws(
    () =>
      buildPageRegistry({ docs: [] }, { toc: { minDepth: 4, maxDepth: 2 } }),
    /registry\.config\.ts: toc minDepth exceeds maxDepth/,
  );
  assert.deepEqual(
    buildPageRegistry({ docs: [{ file: "page.md" }] }, { toc: false }).pages[0]
      .toc,
    false,
  );
});

test("ordinary configured Markdown files have distinct routes", () => {
  const registry = buildPageRegistry({
    docs: [{ file: "page.mdx" }, { file: "architecture.md" }],
    packages: [{ file: "moyaforge/README.md" }],
  });
  assert.equal(
    registry.byPath.get("/docs/architecture")?.file,
    "architecture.md",
  );
  assert.equal(
    registry.byPath.get("/packages/moyaforge/README")?.file,
    "moyaforge/README.md",
  );
  assert.equal(registry.byPath.get("/docs")?.file, "page.mdx");
});

test("duplicate route reports both source-relative content paths", () => {
  assert.throws(
    () => buildPageRegistry({ docs: [
      { file: "01-api/page.md" },
      { file: "02-api/page.mdx" },
    ] }),
    /Duplicate route \/docs\/api: docs\/01-api\/page\.md and docs\/02-api\/page\.mdx/,
  );
});
