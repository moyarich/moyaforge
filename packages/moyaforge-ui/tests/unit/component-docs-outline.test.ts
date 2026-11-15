import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

test("parent component pages expose a navigable section outline", () => {
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
    const headings = [...source.matchAll(/^## (.+)$/gm)].map(
      (match) => match[1],
    );
    expect(
      headings.length,
      `${page}: should expose section headings`,
    ).toBeGreaterThan(0);
    expect(
      source,
      `${page}: should include a live code-preview example`,
    ).toMatch(/::: ?code-preview|<CodePreview\\b/);
    expect(
      new Set(headings).size,
      `${page}: section headings should be unique`,
    ).toBe(headings.length);
  }
});
