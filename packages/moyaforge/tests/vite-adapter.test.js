import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { moyaforgeVite } from "../dist/vite.js";

test("legacy pages manifest uses shared configurable page discovery", () => {
  const root = mkdtempSync(join(tmpdir(), "moyaforge-vite-"));
  try {
    mkdirSync(join(root, "guide", "01-start"), { recursive: true });
    writeFileSync(join(root, "guide", "01-start", "page.mdx"), "# Start");
    writeFileSync(join(root, "guide", "note.md"), "# Not a landing page");
    const plugin = moyaforgeVite({
      root,
      collections: { guide: { dir: "guide", baseUrl: "/guide" } },
    });
    const id = plugin.resolveId("virtual:moyaforge/pages");
    const code = plugin.load(id);
    assert.ok(code.includes("01-start/page.mdx"));
    assert.match(code, /baseUrl: "\/guide"/);
    assert.doesNotMatch(code, /note\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("lazy legacy manifest avoids static imports and preserves collection shape", () => {
  const root = mkdtempSync(join(tmpdir(), "moyaforge-lazy-"));
  try {
    mkdirSync(join(root, "guide"), { recursive: true });
    writeFileSync(join(root, "guide", "page.mdx"), "# Guide");
    const plugin = moyaforgeVite({
      root,
      collections: { guide: { dir: "guide", baseUrl: "/guide" } },
    });
    const id = plugin.resolveId("virtual:moyaforge/lazy-pages");
    const code = plugin.load(id);
    assert.match(code, /\(\) => import\(/);
    assert.doesNotMatch(code, /import \* as page/);
    assert.match(code, /baseUrl: "\/guide"/);
    assert.match(code, /"page.mdx": \(\) => import/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("legacy Vite HMR only reloads registered content roots", () => {
  const root = mkdtempSync(join(tmpdir(), "moyaforge-hmr-"));
  try {
    mkdirSync(join(root, "docs"), { recursive: true });
    mkdirSync(join(root, "docs-other"), { recursive: true });
    const plugin = moyaforgeVite({
      root,
      collections: { docs: { dir: "docs", baseUrl: "/docs" } },
    });
    const invalidated = [];
    const messages = [];
    const ctx = (file) => ({
      file,
      server: {
        moduleGraph: {
          getModuleById: (id) => ({ id }),
          invalidateModule: (mod) => invalidated.push(mod.id),
        },
        ws: { send: (msg) => messages.push(msg) },
      },
    });
    plugin.handleHotUpdate(ctx(join(root, "docs-other", "page.mdx")));
    plugin.handleHotUpdate(ctx(join(root, "outside.mdx")));
    assert.deepEqual(invalidated, []);
    assert.deepEqual(messages, []);
    plugin.handleHotUpdate(ctx(join(root, "docs", "page.mdx")));
    assert.deepEqual(invalidated, [
      "\0virtual:moyaforge/pages",
      "\0virtual:moyaforge/lazy-pages",
    ]);
    assert.deepEqual(messages, [{ type: "full-reload" }]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});


test("legacy manifests refresh on registered page add and delete only", () => {
  const root = mkdtempSync(join(tmpdir(), "moyaforge-watch-"));
  try {
    mkdirSync(join(root, "docs"), { recursive: true });
    const plugin = moyaforgeVite({ root, collections: { docs: { dir: "docs", baseUrl: "/docs" } } });
    const handlers = {};
    const invalidated = [];
    const messages = [];
    plugin.configureServer({
      watcher: { on(event, callback) { handlers[event] = callback; } },
      moduleGraph: {
        getModuleById: (id) => ({ id }),
        invalidateModule: (mod) => invalidated.push(mod.id),
      },
      ws: { send: (message) => messages.push(message) },
    });
    handlers.add(join(root, "docs", "page.mdx"));
    handlers.unlink(join(root, "docs", "nested", "page.md"));
    handlers.add(join(root, "docs", "README.md"));
    handlers.add(join(root, "docs-other", "page.mdx"));
    assert.equal(invalidated.length, 4);
    assert.equal(messages.length, 2);
    assert.ok(messages.every((message) => message.type === "full-reload"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
