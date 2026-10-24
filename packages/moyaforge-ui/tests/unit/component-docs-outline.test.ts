import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

test("parent component pages include the standard sections regardless of order", () => {
  const docs = fileURLToPath(
    new URL("../../docs/01-components/", import.meta.url),
  );
  // Nested example pages and the components index have their own outlines.
  const pages = readdirSync(docs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(docs, entry.name, "page.mdx"));

  expect(pages.length).toBeGreaterThan(20);
  for (const page of pages) {
    const source = readFileSync(page, "utf8");
    const headings = new Set(
      [...source.matchAll(/^## (.+)$/gm)].map((match) => match[1]),
    );
    for (const heading of ["Installation", "Usage", "Examples", "Styling"]) {
      expect(headings.has(heading), `${page}: missing ${heading}`).toBe(true);
    }
  }
});
