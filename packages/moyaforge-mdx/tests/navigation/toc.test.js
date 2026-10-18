import { test } from "vitest";
import assert from "node:assert/strict";
import {
  getTableOfContents,
  resolveTocOptions,
  filterTableOfContents,
} from "../../dist/index.js";

const tree = [
  {
    id: "intro",
    value: "Intro",
    depth: 1,
    children: [
      {
        id: "setup",
        value: "Setup",
        depth: 2,
        children: [
          { id: "options", value: "Options", depth: 3 },
          { id: "options-1", value: "Options", depth: 3 },
        ],
      },
      { id: "reference", value: "Reference", depth: 2 },
    ],
  },
];

test("page settings override project settings, including explicit false", () => {
  assert.equal(
    resolveTocOptions(false, { placement: "sidebar" }).placement,
    "none",
  );
  assert.equal(
    resolveTocOptions({ placement: "inline" }, { placement: "sidebar" })
      .placement,
    "inline",
  );
  assert.equal(resolveTocOptions().label, "On this page");
  assert.equal(
    resolveTocOptions(true, { placement: "none" }).placement,
    "right",
  );
});

test("heading trees retain rehype-generated IDs and nested depths", () => {
  const filtered = filterTableOfContents(tree);
  assert.deepEqual(
    filtered.map((h) => h.id),
    ["setup", "reference"],
  );
  assert.deepEqual(
    filtered[0].children.map((h) => h.id),
    ["options", "options-1"],
  );
  assert.deepEqual(
    filterTableOfContents(tree, { minDepth: 3, maxDepth: 3 }).map((h) => h.id),
    ["options", "options-1"],
  );
  assert.deepEqual(filterTableOfContents(tree, false), []);
});

test("empty and disabled TOCs have no visible placement", () => {
  assert.equal(getTableOfContents([]).options.placement, "none");
  assert.equal(getTableOfContents(tree, false).options.placement, "none");
  assert.equal(
    getTableOfContents(tree, { placement: "sidebar" }).options.placement,
    "sidebar",
  );
});
