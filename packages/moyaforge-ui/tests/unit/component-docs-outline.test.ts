import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

test("component documentation pages use the standard section outline", () => {
  const docs = fileURLToPath(
    new URL("../../docs/01-components/", import.meta.url),
  );
  const pages = readdirSync(docs, { recursive: true })
    .filter((name) => String(name).endsWith("/page.mdx"))
    .map((name) => join(docs, String(name)));

  expect(pages.length).toBeGreaterThan(20);
  for (const page of pages) {
    const source = readFileSync(page, "utf8");
    const headings = [...source.matchAll(/^## (.+)$/gm)].map(
      (match) => match[1],
    );
    const sectionIndexes = ["Installation", "Usage", "Examples", "Styling"].map(
      (heading) => headings.indexOf(heading),
    );
    expect(sectionIndexes, page).toEqual(
      [...sectionIndexes].sort((a, b) => a - b),
    );
    expect(
      sectionIndexes.every((index) => index >= 0),
      page,
    ).toBe(true);
  }
});
