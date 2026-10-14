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
    await writeFile(
      join(root, "docs", "page.md"),
      "# Welcome\n\nUnique-home-marker",
    );
    await writeFile(
      join(root, "docs", "01-guide", "page.mdx"),
      "# Guide\n\nUnique-guide-marker",
    );
    await mkdir(join(root, "docs", "02-hidden"), { recursive: true });
    await mkdir(join(root, "docs", "03-disabled"), { recursive: true });
    await writeFile(
      join(root, "docs", "02-hidden", "page.md"),
      "---\\nnavigation: hidden\\n---\\n# Hidden searchable page",
    );
    await writeFile(
      join(root, "docs", "03-disabled", "page.mdx"),
      "---\\nnavigation: disabled\\n---\\n# Disabled page",
    );
    await writeFile(
      join(root, "docs", "README.md"),
      "# Not a page\n\nUnique-readme-marker",
    );
    await writeFile(
      join(root, "docs", "01-guide", "notes.mdx"),
      "# Notes\n\nUnique-notes-marker",
    );
    const plugin = sqliteSearchPlugin({
      root,
      registry: {
        sources: { docs: { base: "docs", include: ["**/*.md", "**/*.mdx"] } },
      },
    });
    plugin.configResolved({ command: "build", base: "/project/" });
    const id = plugin.resolveId("virtual:moyaforge-search/database");
    const emitted = [];
    const module = await plugin.load.call(
      {
        emitFile(file) {
          emitted.push(file);
        },
      },
      id,
    );
    assert.equal(emitted.length, 1);
    assert.match(emitted[0].fileName, /^assets\/search-[a-f0-9]{10}\.sqlite$/);
    assert.match(module, /import\.meta\.env\.BASE_URL/);
    assert.ok(module.includes(emitted[0].fileName));
    const SQL = await initSqlJs();
    const db = new SQL.Database(emitted[0].source);
    try {
      const rows = db.exec("SELECT key FROM documents ORDER BY key");
      const keys = rows[0]?.values.map(([key]) => key) ?? [];
      assert.deepEqual(keys, [
        "docs/01-guide/page.mdx",
        "docs/02-hidden/page.md",
        "docs/page.md",
      ]);
    } finally {
      db.close();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("development endpoint serves fresh SQLite data after a source change", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-sqlite-dev-"));
  try {
    const docs = join(root, "docs");
    await mkdir(docs);
    const page = join(docs, "page.md");
    await writeFile(page, "# First version");
    const plugin = sqliteSearchPlugin({
      root,
      registry: { sources: { docs: { base: "docs", include: ["**/page.md"] } } },
    });
    plugin.configResolved({ command: "serve", base: "/preview/" });
    const id = plugin.resolveId("virtual:moyaforge-search/database");
    const module = await plugin.load(id);
    assert.match(module, /import\.meta\.env\.BASE_URL/);
    assert.match(module, /__moyaforge_search\.sqlite/);
    const handlers = new Map();
    const events = [];
    let middleware;
    plugin.configureServer({
      watcher: {
        add() {},
        on(event, callback) { handlers.set(event, callback); },
      },
      ws: { send(event) { events.push(event); } },
      middlewares: { use(callback) { middleware = callback; } },
    });
    const fetchDatabase = async () => {
      const headers = {};
      let payload;
      let nextCalled = false;
      await middleware(
        { url: "/preview/__moyaforge_search.sqlite?cache=off" },
        {
          setHeader(name, value) { headers[name] = value; },
          end(data) { payload = data; },
        },
        () => { nextCalled = true; },
      );
      assert.equal(nextCalled, false);
      assert.equal(headers["Content-Type"], "application/vnd.sqlite3");
      assert.equal(headers["Cache-Control"], "no-store");
      assert.ok(payload?.length);
      const SQL = await initSqlJs();
      const db = new SQL.Database(payload);
      try {
        return db.exec("SELECT body FROM documents")[0].values[0][0];
      } finally {
        db.close();
      }
    };
    assert.match(await fetchDatabase(), /First version/);
    await writeFile(page, "# Updated version");
    handlers.get("change")(page);
    assert.deepEqual(events, [{ type: "custom", event: "moyaforge-search:updated" }]);
    assert.match(await fetchDatabase(), /Updated version/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
