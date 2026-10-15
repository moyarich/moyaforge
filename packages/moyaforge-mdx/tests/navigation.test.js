import assert from "node:assert/strict";
import { test } from "vitest";
import {
  buildPageRegistry,
  buildNavigationTree,
  flattenNavigation,
} from "../dist/index.js";

test("navigation follows nested section order rather than flattening global numeric prefixes", () => {
  const registry = buildPageRegistry({
    docs: [
      { file: "02-secondary/page.mdx" },
      { file: "01-primary/02-next/page.md" },
      { file: "01-primary/01-first/page.mdx" },
      { file: "page.md" },
      { file: "01-primary/page.mdx" },
    ],
  });
  assert.deepEqual(
    registry.navigation.map((page) => page.path),
    [
      "/docs",
      "/docs/primary",
      "/docs/primary/first",
      "/docs/primary/next",
      "/docs/secondary",
    ],
  );
  assert.equal(registry.tree[0].path, "/docs");
  assert.deepEqual(
    registry.previousNext("/docs/primary/next").next?.path,
    "/docs/secondary",
  );
});

test("missing landing pages produce virtual groups without inventing routes", () => {
  const registry = buildPageRegistry({
    docs: [
      { file: "02-group/01-b/page.md" },
      { file: "01-group/01-a/page.md" },
      {
        file: "01-group/02-private/page.md",
        frontmatter: { navigation: "hidden" },
      },
      { file: "03-off/page.md", frontmatter: { navigation: "disabled" } },
    ],
  });
  assert.deepEqual(
    registry.navigation.map((page) => page.path),
    ["/docs/group/a", "/docs/group/b"],
  );
  assert.equal(registry.tree[0].page, undefined);
  assert.equal(registry.byPath.has("/docs/group/private"), true);
  assert.equal(registry.byPath.has("/docs/off"), false);
  assert.deepEqual(
    flattenNavigation(buildNavigationTree(registry.navigation)).map(
      (page) => page.path,
    ),
    registry.navigation.map((page) => page.path),
  );
});
