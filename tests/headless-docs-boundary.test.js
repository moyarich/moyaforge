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

test("legacy DocsRoutes delegates route rendering to the headless implementation", async () => {
  const source = await readFile(
    new URL(
      "../packages/moyaforge/src/components/DocsRoutes/DocsRoutes.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  expect(source).toContain("HeadlessDocsRoutes");
  expect(source).toContain("renderLayout");
  expect(source).toContain("<DocsLayout");
  expect(source).not.toContain("source.getPage(");
});

test("headless package subpath exports routing without legacy layout imports", async () => {
  const source = await readFile(
    new URL("../packages/moyaforge/src/headless.ts", import.meta.url),
    "utf8",
  );
  const pkg = JSON.parse(
    await readFile(
      new URL("../packages/moyaforge/package.json", import.meta.url),
      "utf8",
    ),
  );
  expect(pkg.exports["./headless"]).toEqual({
    types: "./dist/headless.d.ts",
    import: "./dist/headless.js",
  });
  expect(source).toContain("HeadlessDocsRoutes");
  expect(source).toContain("RegistryRouteView");
  expect(source).not.toMatch(
    /DocsLayout|DocumentationSite|SidebarV1|SidebarV2|DocOutline/,
  );
});
