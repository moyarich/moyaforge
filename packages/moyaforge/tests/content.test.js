import assert from "node:assert/strict";
import test from "node:test";

import {
  createPages,
  filterPages,
  labelFromSegment,
} from "../dist/content.js";
import { buildNavigation } from "../dist/navigation.js";

test("ordered folders become readable labels", () => {
  assert.equal(labelFromSegment("01-getting-started"), "Getting Started");
});

test("createPages preserves numeric folder order and frontmatter", () => {
  const pages = createPages({
    "./02-guides/page.mdx": {
      default: () => null,
      frontmatter: { label: "Guides" },
    },
    "./01-getting-started/page.mdx": {
      default: () => null,
      frontmatter: { label: "Start" },
    },
  });

  assert.deepEqual(
    pages.map(({ label }) => label),
    ["Start", "Guides"],
  );
});

test("buildNavigation creates nested ordinary data", () => {
  const pages = createPages({
    "./01-guides/01-config/page.mdx": {
      default: () => null,
      frontmatter: { label: "Configuration" },
    },
  });

  const navigation = buildNavigation(pages);

  assert.equal(navigation[0].label, "Guides");
  assert.equal(navigation[0].children[0].page.label, "Configuration");
});

test("filterPages searches labels and navigation paths", () => {
  const pages = createPages({
    "./01-guides/01-config/page.mdx": {
      default: () => null,
      frontmatter: { label: "Configuration" },
    },
  });

  assert.equal(filterPages(pages, "guides").length, 1);
  assert.equal(filterPages(pages, "missing").length, 0);
});

test("root page.mdx resolves to the index page", () => {
  const pages = createPages({
    "./page.mdx": { default: () => null, frontmatter: { label: "Home" } },
  });

  assert.equal(pages[0].id, "index");
  assert.deepEqual(pages[0].navPath, []);
});
