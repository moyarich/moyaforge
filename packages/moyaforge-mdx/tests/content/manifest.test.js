import assert from "node:assert/strict";
import { test } from "vitest";
import { buildPageRegistry } from "../../dist/registry/registry.js";
import { createContentManifest } from "../../dist/content/manifest.js";

test("canonical manifest combines route and heading metadata in registry order", () => {
  const registry = buildPageRegistry({
    docs: [
      { file: "02-disabled/page.mdx", frontmatter: { navigation: "disabled" } },
      { file: "01-guide/page.mdx", frontmatter: { title: "Guide", navigation: "hidden" } },
      { file: "page.mdx", frontmatter: { title: "Docs" } },
    ],
  });
  const headings = {
    "docs/01-guide/page.mdx": [{ id: "overview", value: "Overview", depth: 2 }],
  };
  const manifest = createContentManifest({ registry, headings });
  assert.deepEqual(manifest.map((page) => page.path), ["/docs", "/docs/guide"]);
  assert.deepEqual(manifest[0].headings, []);
  assert.deepEqual(manifest[1].headings, headings["docs/01-guide/page.mdx"]);
  assert.equal(manifest[1].navigation, "hidden");
  assert.equal(manifest.some((page) => page.path === "/docs/disabled"), false);
});
