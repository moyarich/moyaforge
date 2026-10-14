import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPageRegistry, validateInternalLinks } from "../dist/index.js";

const registry = buildPageRegistry({
  docs: [
    { file: "page.md" },
    { file: "01-guide/page.mdx" },
    { file: "02-disabled/page.md", frontmatter: { navigation: "disabled" } },
  ],
});
const headings = {
  "docs/page.md": [{ id: "welcome", value: "Welcome", depth: 1 }],
  "docs/01-guide/page.mdx": [{ id: "install", value: "Install", depth: 2 }],
};

test("valid relative, absolute and anchor links do not produce diagnostics", () => {
  const issues = validateInternalLinks(
    [
      {
        source: "docs",
        file: "page.md",
        content:
          "[Guide](./guide#install) [Home](#welcome) [Absolute](/docs/guide#install) [Email](mailto:help@example.org) [External](https://example.org)",
      },
    ],
    registry,
    headings,
  );
  assert.deepEqual(issues, []);
});

test("missing page and heading fragments report source file and original URL", () => {
  const issues = validateInternalLinks(
    [
      {
        source: "docs",
        file: "page.md",
        content:
          "[Broken](/docs/missing) [Wrong](./guide#not-here) [Disabled](./disabled)",
      },
    ],
    registry,
    headings,
  );
  assert.deepEqual(
    issues.map(({ href, reason }) => [href, reason]),
    [
      ["/docs/missing", "missing-page"],
      ["./guide#not-here", "missing-anchor"],
      ["./disabled", "missing-page"],
    ],
  );
  assert.ok(issues.every((issue) => issue.file === "docs/page.md"));
});

test("image URLs and fenced-code links are not treated as internal document links", () => {
  const issues = validateInternalLinks(
    [
      {
        source: "docs",
        file: "page.md",
        content:
          "![Image](./missing.png)\n\n\`\`\`md\n[Missing](/docs/missing)\n\`\`\`\n",
      },
    ],
    registry,
    headings,
  );
  assert.deepEqual(issues, []);
});
