import { test } from "vitest";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("consumer-facing package entry points compose independently", async () => {
  const [mdx, registry, search, searchVite, toc] = await Promise.all([
    import("@moyarich/moyaforge-mdx"),
    import("@moyarich/moyaforge-mdx/vite"),
    import("@moyarich/moyaforge-search-sqlite"),
    import("@moyarich/moyaforge-search-sqlite/vite"),
    import("@moyarich/moyaforge-mdx/toc"),
  ]);
  // React/Monaco UI imports CSS and needs a bundler. Resolve its public
  // entry here; the playground and standalone Vite builds verify its runtime.
  const uiEntry = import.meta.resolve("@moyarich/moyaforge");
  assert.match(uiEntry, /\/moyaforge\/dist\/index\.js$/);
  const uiSource = await readFile(new URL(uiEntry), "utf8");
  assert.match(uiSource, /components\/index\.js/);
  assert.equal(typeof mdx.createMdxOptions, "function");
  assert.equal(typeof registry.mdxRegistryPlugin, "function");
  assert.equal(typeof search.buildSearchDatabase, "function");
  assert.equal(typeof searchVite.sqliteSearchPlugin, "function");
  assert.equal(typeof toc.getTableOfContents, "function");
  assert.throws(
    () => import.meta.resolve("@moyarich/moyaforge/mdx"),
    /not defined by "exports"/,
  );
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
