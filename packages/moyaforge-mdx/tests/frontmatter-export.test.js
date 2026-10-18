import { test } from "vitest";
import assert from "node:assert/strict";
import { createMdxOptions, parsePageFrontmatter } from "../dist/index.js";

test("registry metadata does not require a compiled JavaScript frontmatter export", () => {
  const yaml = "---\ntitle: From YAML\nnavigation: hidden\n---\n# Page";
  assert.deepEqual(parsePageFrontmatter(yaml, "page.mdx"), {
    title: "From YAML",
    navigation: "hidden",
  });
  const defaults = createMdxOptions();
  assert.equal(defaults.remarkPlugins.length, 3);
  const legacy = createMdxOptions({ frontmatterExport: true });
  assert.equal(legacy.remarkPlugins.length, 4);
  assert.equal(legacy.rehypePlugins.length, defaults.rehypePlugins.length);
});
