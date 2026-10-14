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
    const plugin = moyaforgeVite({ root, collections: { guide: { dir: "guide", baseUrl: "/guide" } } });
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
