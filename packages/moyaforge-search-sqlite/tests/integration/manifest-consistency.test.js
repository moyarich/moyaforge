import assert from "node:assert/strict";
import { test } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import initSqlJs from "sql.js";
import { sqliteSearchPlugin } from "../../vite-plugin/index.js";

async function index(registry, root) {
  const plugin = sqliteSearchPlugin({ registry, root });
  plugin.configResolved({ command: "build", base: "/project/" });
  const id = plugin.resolveId("virtual:moyaforge-search/database");
  let asset;
  await plugin.load.call(
    {
      emitFile(file) {
        asset = file;
      },
    },
    id,
  );
  const SQL = await initSqlJs();
  const db = new SQL.Database(asset.source);
  try {
    return (
      db.exec("SELECT key, title, description FROM documents ORDER BY key")[0]
        ?.values ?? []
    );
  } finally {
    db.close();
  }
}

test("search titles and visibility match canonical MDX manifest across collections", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-manifest-"));
  try {
    await mkdir(join(root, "docs", "01-guide"), { recursive: true });
    await mkdir(join(root, "api"), { recursive: true });
    await writeFile(
      join(root, "docs", "01-guide", "page.mdx"),
      "---\ntitle: Getting started\ndescription: Welcome to guides\n---\n# Guide",
    );
    await writeFile(
      join(root, "api", "page.md"),
      "---\ntitle: API Reference\nnavigation: hidden\n---\n# API",
    );
    await writeFile(
      join(root, "docs", "page.md"),
      "---\nnavigation: disabled\n---\n# Not searchable",
    );
    const registry = {
      sources: {
        docs: { base: "docs", include: ["**/*.md", "**/*.mdx"] },
        api: { base: "api", include: ["**/*.md"] },
      },
    };
    assert.deepEqual(await index(registry, root), [
      ["api/page.md", "API Reference", ""],
      ["docs/01-guide/page.mdx", "Getting started", "Welcome to guides"],
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("search rejects duplicate normalized routes with both source filenames", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-duplicate-"));
  try {
    for (const name of ["01-guide", "02-guide"]) {
      await mkdir(join(root, "docs", name), { recursive: true });
      await writeFile(join(root, "docs", name, "page.md"), "# Guide");
    }
    await assert.rejects(
      index(
        { sources: { docs: { base: "docs", include: ["**/*.md"] } } },
        root,
      ),
      /Duplicate route \/docs\/guide: docs\/01-guide\/page\.md and docs\/02-guide\/page\.md/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
