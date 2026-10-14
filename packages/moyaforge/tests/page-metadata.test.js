import assert from "node:assert/strict";
import test from "node:test";
import { parseMoyaForgePageMetadata, resolveMoyaForgeTocOptions } from "../dist/utils/content/index.js";

test("frontmatter uses label or title with clear defaults", () => {
  assert.equal(parseMoyaForgePageMetadata({ title: "Guide" }, "docs/page.mdx").label, "Guide");
  assert.equal(parseMoyaForgePageMetadata({ label: " Docs ", title: "Documentation" }, "docs/page.mdx").label, "Docs");
  assert.deepEqual(resolveMoyaForgeTocOptions({ toc: true }), {
    show: true, collapsible: true, defaultOpen: true, label: "On this page",
  });
  assert.equal(resolveMoyaForgeTocOptions({ toc: false }).show, false);
  assert.deepEqual(resolveMoyaForgeTocOptions({ toc: { defaultOpen: false, label: "Contents" } }), {
    show: true, collapsible: true, defaultOpen: false, label: "Contents",
  });
});
test("frontmatter rejects invalid navigation and TOC values", () => {
  assert.throws(() => parseMoyaForgePageMetadata({}, "docs/page.mdx"), /label/);
  assert.throws(() => parseMoyaForgePageMetadata({ label: "X", navigation: "no" }, "docs/page.mdx"), /navigation/);
  assert.throws(() => parseMoyaForgePageMetadata({ label: "X", toc: { show: "yes" } }, "docs/page.mdx"), /toc.show/);
});
