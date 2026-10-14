import assert from "node:assert/strict";
import { test } from "node:test";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions, extractPageHeadings } from "../dist/index.js";

const source = [
  "---",
  "title: Shared pipeline",
  "---",
  "# Shared pipeline",
  "",
  "## Setup",
  "",
  "## Setup",
  "",
  "- [x] Complete",
  "",
  "```js",
  "const ready = true;",
  "```",
].join("\n");

test("the shared compiler handles Markdown and MDX with matching heading anchors", async () => {
  const options = createMdxOptions();
  const markdown = String(await compile({ value: source, path: "page.md" }, options));
  const mdx = String(
    await compile(
      { value: source + '\n\n<Demo title="Example" />', path: "page.mdx" },
      options,
    ),
  );
  for (const output of [markdown, mdx]) {
    assert.match(output, /id: "shared-pipeline"/);
    assert.match(output, /id: "setup"/);
    assert.match(output, /id: "setup-1"/);
    assert.match(output, /type: "checkbox"/);
    assert.match(output, /const ready = true/);
    assert.doesNotMatch(output, /export const frontmatter/);
  }
  assert.match(mdx, /Demo/);
  const headings = await extractPageHeadings(source, "page.md");
  assert.equal(headings[0].id, "shared-pipeline");
  assert.deepEqual(headings[0].children.map((entry) => entry.id), ["setup", "setup-1"]);
});

test("frontmatter JavaScript export remains an explicit option", async () => {
  const compiled = String(
    await compile({ value: source, path: "page.mdx" }, createMdxOptions({ frontmatterExport: true })),
  );
  assert.match(compiled, /frontmatter/);
  assert.match(compiled, /Shared pipeline/);
});
