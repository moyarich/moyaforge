import assert from "node:assert/strict";
import { test } from "vitest";
import {
  createMdxOptions,
  extractPageHeadings,
  getTableOfContents,
} from "../dist/index.js";

const markdown = `---
title: Compiler parity
toc:
  minDepth: 2
  maxDepth: 3
---
# Compiler parity

## Setup

- [x] GFM task item

### Options

### Options

\`\`\`js
## Not a heading
\`\`\`
`;

test("Markdown and MDX resolve identical heading IDs and filtered TOCs", async () => {
  const mdx = markdown + "\n<Demo value={1 + 2} />\n\n{/* Not a heading */}\n";
  const [mdHeadings, mdxHeadings] = await Promise.all([
    extractPageHeadings(markdown, "page.md"),
    extractPageHeadings(mdx, "page.mdx"),
  ]);
  assert.deepEqual(mdxHeadings, mdHeadings);
  const toc = getTableOfContents(mdHeadings, { minDepth: 2, maxDepth: 3 });
  assert.deepEqual(
    toc.headings.map((item) => item.id),
    ["setup"],
  );
  assert.deepEqual(
    toc.headings[0].children.map((item) => item.id),
    ["options", "options-1"],
  );
  assert.equal(
    toc.headings.some((item) => item.id === "not-a-heading"),
    false,
  );
});

test("compiler plugin options do not mutate later calls", () => {
  const extra = () => {};
  const withExtension = createMdxOptions({ rehypePlugins: [extra] });
  const plain = createMdxOptions();
  assert.equal(withExtension.rehypePlugins.at(-1), extra);
  assert.equal(plain.rehypePlugins.includes(extra), false);
  assert.equal(plain.remarkPlugins.length, 2);
});
