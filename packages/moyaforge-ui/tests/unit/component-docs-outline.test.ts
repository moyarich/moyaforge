import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

function findExamplePages(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const child = join(folder, entry.name);
      const page = join(child, "page.mdx");
      const ownPage = existsSync(page) ? [page] : [];
      return [...ownPage, ...findExamplePages(child)];
    });
}

test("component example pages include a live CodePreview", () => {
  const docs = fileURLToPath(
    new URL("../../docs/01-components/", import.meta.url),
  );
  // Parent pages may use their own outline; nested example pages show live usage.
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
      new Set(headings).size,
      `${page}: section headings should be unique`,
    ).toBe(headings.length);
  }

  const examples = pages.flatMap((page) =>
    findExamplePages(join(page, "..")),
  );
  expect(examples.length).toBeGreaterThan(20);
  for (const page of examples) {
    expect(
      readFileSync(page, "utf8"),
      `${page}: should include CodePreview or ::: code-preview`,
    ).toMatch(/::: ?code-preview|<CodePreview\b/);
  }
});
