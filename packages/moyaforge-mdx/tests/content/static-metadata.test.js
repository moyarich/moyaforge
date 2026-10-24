import assert from "node:assert/strict";
import { test } from "vitest";
import { buildPageRegistry } from "../../dist/registry/registry.js";
import { createContentManifest } from "../../dist/content/manifest.js";
import { createStaticPageMetadata } from "../../dist/content/static-metadata.js";

test("static metadata is sorted, portable and respects visibility", () => {
  const registry = buildPageRegistry({
    docs: [
      { file: "02-private/page.mdx", frontmatter: { navigation: "disabled" } },
      { file: "01-guide/page.mdx", frontmatter: { navigation: "hidden", description: "Guide description" } },
      { file: "page.mdx", frontmatter: { title: "Overview" } },
    ],
  });
  const manifest = createContentManifest({
    registry,
    headings: {
      "docs/01-guide/page.mdx": [
        { id: "intro", value: "Introduction", depth: 2, children: [
          { id: "detail", value: "Details", depth: 3 },
        ] },
      ],
    },
  });
  assert.deepEqual(createStaticPageMetadata(manifest), [
    {
      path: "/docs", title: "Overview", source: "docs",
      sourceFile: "page.mdx", headings: [],
    },
    {
      path: "/docs/guide", title: "Guide", description: "Guide description",
      source: "docs", sourceFile: "01-guide/page.mdx",
      headings: [
        { id: "intro", label: "Introduction", depth: 2 },
        { id: "detail", label: "Details", depth: 3 },
      ],
    },
  ]);
});
