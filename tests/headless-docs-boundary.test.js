import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";

test("headless docs routing does not import installable UI", async () => {
  const source = await readFile(
    new URL(
      "../packages/moyaforge/src/components/Routing/HeadlessDocsRoutes.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  expect(source).not.toMatch(
    /DocsLayout|SidebarV1|SidebarV2|DocOutline|moyaforge-ui/,
  );
  expect(source).toContain("renderLayout");
});

test("both framework entrypoints expose headless documentation routes", async () => {
  for (const entry of ["index.ts", "docs.ts"]) {
    const source = await readFile(
      new URL(`../packages/moyaforge/src/${entry}`, import.meta.url),
      "utf8",
    );
    expect(source).toContain("HeadlessDocsRoutes");
  }
});
