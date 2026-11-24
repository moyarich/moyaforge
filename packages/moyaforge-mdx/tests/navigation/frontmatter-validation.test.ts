import { expect, test } from "vitest";
import { validatePageFrontmatter } from "../../src/registry/validate-page-frontmatter.js";

const filename = "docs/guide/page.mdx";

test("validation accepts unknown input and narrows it without modifying metadata", () => {
  const metadata: unknown = Object.freeze({
    title: "Guide",
    order: 0,
    navigation: "hidden",
    sidebar: { group: true },
    toc: { placement: "sidebar", minDepth: 2, maxDepth: 4, label: "Contents" },
  });
  validatePageFrontmatter(metadata, filename);
  expect(metadata.title).toBe("Guide");
  expect(metadata.order).toBe(0);
});
test.each([null, undefined, [], "Guide", 42])(
  "rejects non-object metadata with its source filename: %j",
  (metadata) => {
    expect(() => validatePageFrontmatter(metadata, filename)).toThrow(
      `${filename}: frontmatter must be an object`,
    );
  },
);
test.each([
  [{ title: 1 }, "title must be a string"],
  [{ title: " " }, "title must not be empty"],
  [{ label: "Guide" }, "use title instead of label"],
  [{ order: "1" }, "order must be a finite number"],
  [{ order: Infinity }, "order must be a finite number"],
  [{ icon: false }, "icon must be a string"],
  [{ navigation: null }, "invalid navigation mode"],
  [{ sidebar: { group: "yes" } }, "sidebar group must be boolean"],
  [{ sidebar: { label: "Guide" } }, "use the page title"],
  [{ toc: null }, "invalid toc setting"],
  [{ toc: { minDepth: "2" } }, "toc depths must be integers"],
  [{ toc: { minDepth: 4, maxDepth: 2 } }, "toc minDepth exceeds maxDepth"],
  [{ toc: { placement: false } }, "invalid toc placement"],
])(
  "reports malformed known fields without throwing incidental JavaScript errors: %j",
  (metadata, message) => {
    expect(() => validatePageFrontmatter(metadata, filename)).toThrow(message);
  },
);
