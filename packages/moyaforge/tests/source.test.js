import assert from "node:assert/strict";
import test from "node:test";
import { createMoyaForgeSource } from "../dist/utils/content/index.js";

test("multiple collections resolve ordered page URLs and metadata", () => {
  const source = createMoyaForgeSource({
    docs: { dir: "docs", baseUrl: "/docs", modules: {
      "page.mdx": { frontmatter: { title: "Home" } },
      "01-guides/page.mdx": { frontmatter: { title: "Guides", headings: [{ id: "start", label: "Start", level: 2 }] } },
      "02-hidden/page.mdx": { frontmatter: { hidden: true } },
    } },
    examples: { dir: "examples", baseUrl: "/examples", modules: { "page.mdx": { frontmatter: { title: "Examples" } } } },
  });
  assert.deepEqual(source.getPages("docs").map((p) => p.url), ["/docs/guides", "/docs"]);
  assert.equal(source.getPage("/docs/guides")?.sourcePath, "docs/01-guides/page.mdx");
  assert.equal(source.getPage("/docs/guides/")?.title, "Guides");
  assert.equal(source.getPage("/docs/")?.title, "Home");
  assert.equal(source.getTableOfContents("/docs/guides/")[0]?.id, "start");
  assert.equal(source.getTableOfContents("/docs/guides")[0]?.id, "start");
  assert.equal(source.getSearchIndex().length, 3);
  assert.equal(source.getPage("/docs/hidden"), undefined);
});
test("duplicate normalized routes are rejected", () => {
  assert.throws(() => createMoyaForgeSource({ docs: { dir: "docs", baseUrl: "/docs", modules: {
    "01-guides/page.mdx": {}, "02-guides/page.mdx": {},
  } } }), /Duplicate MoyaForge route/);
});
