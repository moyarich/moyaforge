import { test } from "vitest";
import assert from "node:assert/strict";
import { extractPageHeadings } from "../dist/index.js";

test("MDX syntax can coexist with Markdown headings without becoming TOC entries", async () => {
  const source = [
    "---",
    "title: Component guide",
    "---",
    "import { Demo } from './Demo.js'",
    "",
    "# Component guide",
    "",
    "<Demo value={1 + 2} />",
    "",
    "## Installation",
    "",
    "{/* Inline MDX comment */}",
    "",
    "### API",
    "",
    "### API",
  ].join("\n");
  const tree = await extractPageHeadings(source, "page.mdx");
  assert.equal(tree[0].id, "component-guide");
  assert.equal(tree[0].children[0].id, "installation");
  assert.deepEqual(
    tree[0].children[0].children.map((heading) => heading.id),
    ["api", "api-1"],
  );
});
