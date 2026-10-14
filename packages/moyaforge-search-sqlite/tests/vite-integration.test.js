import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import initSqlJs from "sql.js";
import { sqliteSearchPlugin } from "../vite-plugin/index.js";

test("production SQLite search indexes canonical pages and emits a hashed asset", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-sqlite-vite-"));
  try {
    await mkdir(join(root, "docs", "01-guide"), { recursive: true });
    await writeFile(join(root, "docs", "page.md"), "# Welcome\n\nUnique-home-marker");
    await writeFile(join(root, "docs", "01-guide", "page.mdx"), "# Guide\n\nUnique-guide-marker");
    await writeFile(join(root, "docs", "README.md"), "# Not a page\n\nUnique-readme-marker");
    await writeFile(join(root, "docs", "01-guide", "notes.mdx"), "# Notes\n\nUnique-notes-marker");
    const plugin = sqliteSearchPlugin({
      root,
      registry: { sources: { docs: { base: "docs", include: ["**/*.md", "**/*.mdx"] } } },
    });
    plugin.configResolved({ command: "build", base: "/project/" });
    const id = plugin.resolveId("virtual:moyaforge-search/database");
    const emitted = [];
    const module = await plugin.load.call({
      emitFile(file) { emitted.push(file); },
    }, id);
    assert.equal(emitted.length, 1);
    assert.match(emitted[0].fileName, /^assets\/search-[a-f0-9]{10}\.sqlite$/);
    assert.match(module, /import\.meta\.env\.BASE_URL/);
    assert.ok(module.includes(emitted[0].fileName));
    const SQL = await initSqlJs();
    const db = new SQL.Database(emitted[0].source);
    try {
      const rows = db.exec("SELECT key FROM documents ORDER BY key");
      const keys = rows[0]?.values.map(([key]) => key) ?? [];
      assert.deepEqual(keys, ["docs/01-guide/page.mdx", "docs/page.md"]);
    } finally {
      db.close();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
