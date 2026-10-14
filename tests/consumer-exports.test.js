import test from "node:test";
import assert from "node:assert/strict";

test("consumer-facing package entry points compose independently", async () => {
  const [ui, mdx, registry, search, searchVite, toc] = await Promise.all([
    import("@moyarich/moyaforge"),
    import("@moyarich/moyaforge-mdx"),
    import("@moyarich/moyaforge-mdx/vite"),
    import("@moyarich/moyaforge-search-sqlite"),
    import("@moyarich/moyaforge-search-sqlite/vite"),
    import("@moyarich/moyaforge-mdx/toc"),
  ]);
  assert.equal(typeof ui.DocsLayout, "function");
  assert.equal(typeof ui.DocsRoutes, "function");
  assert.equal(typeof mdx.createMdxOptions, "function");
  assert.equal(typeof registry.mdxRegistryPlugin, "function");
  assert.equal(typeof search.buildSearchDatabase, "function");
  assert.equal(typeof searchVite.sqliteSearchPlugin, "function");
  assert.equal(typeof toc.getTableOfContents, "function");
  assert.equal(typeof ui.createMoyaForgeMdxOptions, "undefined");
});

test("canonical Vite plugins accept a plain consumer-owned registry", async () => {
  const { mdxRegistryPlugin } = await import("@moyarich/moyaforge-mdx/vite");
  const { sqliteSearchPlugin } =
    await import("@moyarich/moyaforge-search-sqlite/vite");
  const registry = {
    sources: {
      docs: { base: "docs", include: ["**/page.md", "**/page.mdx"] },
    },
  };
  const root = process.cwd();
  const mdx = mdxRegistryPlugin({ registry, root });
  const sqlite = sqliteSearchPlugin({ registry, root });
  assert.ok(mdx);
  assert.equal(sqlite.name, "moyaforge-search-sqlite:sqlite-search");
  assert.equal(typeof sqlite.resolveId, "function");
});
