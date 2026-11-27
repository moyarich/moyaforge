import { test } from "vitest";
import assert from "node:assert/strict";
import { extractPageHeadings } from "../../dist/index.js";

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

 test("heading discovery reports the authored filename for malformed MDX", async () => {
  await assert.rejects(
    extractPageHeadings("# Heading\n\n{value=1 other=2}", "docs/broken/page.mdx"),
    error => {
      assert.match(error.message, /docs\/broken\/page\.mdx/);
      assert.match(error.message, /3:\d+/);
      assert.ok(error.cause);
      return true;
    },
  );
});
