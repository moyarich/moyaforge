import assert from "node:assert/strict";
import { test } from "vitest";
import {
  parseMoyaForgePageMetadata,
  resolveMoyaForgeTocOptions,
} from "../../dist/utils/content/index.js";

test("frontmatter uses title with clear defaults", () => {
  assert.equal(
    parseMoyaForgePageMetadata({ title: "Guide" }, "docs/page.mdx").title,
    "Guide",
  );
  assert.equal(
    parseMoyaForgePageMetadata(
      { title: " Documentation " },
      "docs/page.mdx",
    ).title,
    "Documentation",
  );
  assert.deepEqual(resolveMoyaForgeTocOptions({ toc: true }), {
    show: true,
    collapsible: true,
    defaultOpen: true,
    label: "On this page",
  });
  assert.equal(resolveMoyaForgeTocOptions({ toc: false }).show, false);
  assert.deepEqual(
    resolveMoyaForgeTocOptions({
      toc: { defaultOpen: false, label: "Contents" },
    }),
    {
      show: true,
      collapsible: true,
      defaultOpen: false,
      label: "Contents",
    },
  );
});
test("frontmatter rejects invalid navigation and TOC values", () => {
  assert.throws(() => parseMoyaForgePageMetadata({}, "docs/page.mdx"), /title/);
  assert.throws(
    () =>
      parseMoyaForgePageMetadata(
        { title: "X", navigation: "no" },
        "docs/page.mdx",
      ),
    /navigation/,
  );
  assert.throws(
    () =>
      parseMoyaForgePageMetadata(
        { title: "X", toc: { show: "yes" } },
        "docs/page.mdx",
      ),
    /toc.show/,
  );
});
