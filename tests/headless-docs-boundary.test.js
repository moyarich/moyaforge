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

test("docs-routes registry installs its headless renderer dependency", async () => {
  const registry = JSON.parse(
    await readFile(new URL("../registry.json", import.meta.url), "utf8"),
  );
  const docsRoutes = registry.items.find(
    (entry) => entry.name === "docs-routes",
  );
  expect(docsRoutes.files.map((file) => file.path)).toContain(
    "packages/moyaforge/src/components/Routing/HeadlessDocsRoutes.tsx",
  );
});

test("playground imports routing from headless subpath rather than docs UI", async () => {
  const source = await readFile(
    new URL("../apps/playground/src/App.jsx", import.meta.url),
    "utf8",
  );
  expect(source).toContain('from "@moyarich/moyaforge/headless"');
  expect(source).toMatch(
    /import \{ MoyaForgeRouter, useContentRouting \} from "@moyarich\/moyaforge\/headless"/,
  );
});

test("playground uses source-owned DocumentationSite with host adapters", async () => {
  const source = await readFile(
    new URL("../apps/playground/src/App.jsx", import.meta.url),
    "utf8",
  );
  expect(source).toContain(
    "packages/moyaforge-ui/src/components/Layout/DocumentationSite/DocumentationSite.tsx",
  );
  expect(source).toContain("onNavigate={navigate}");
  expect(source).toContain("currentPath={page?.path}");
  expect(source).not.toMatch(
    /import\s*\{\s*DocumentationSite[\s\S]*?from "@moyarich\/moyaforge\/docs"/,
  );
});

test("playground sidebar and outline use private UI source instead of framework exports", async () => {
  const source = await readFile(
    new URL("../apps/playground/src/App.jsx", import.meta.url),
    "utf8",
  );
  expect(source).toContain(
    "packages/moyaforge-ui/src/components/SidebarV1/index.ts",
  );
  expect(source).toContain(
    "packages/moyaforge-ui/src/components/DocOutline/index.ts",
  );
  expect(source).not.toMatch(
    /import\s*\{[^}]*SidebarV1[^}]*\}\s*from "@moyarich\/moyaforge\/docs"/,
  );
});

test("playground no longer imports framework's UI-heavy docs subpath", async () => {
  const app = await readFile(
    new URL("../apps/playground/src/App.jsx", import.meta.url),
    "utf8",
  );
  const navigation = await readFile(
    new URL("../apps/playground/src/documentation-groups.js", import.meta.url),
    "utf8",
  );
  expect(app).not.toContain('from "@moyarich/moyaforge/docs"');
  expect(app).toContain('from "./documentation-groups.js"');
  expect(navigation).toContain('from "@moyarich/moyaforge-mdx/navigation"');
});
