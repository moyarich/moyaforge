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
    assert.ok(code.includes("01-start/page.mdx"));
    const id = plugin.resolveId("virtual:moyaforge/pages");
    const code = plugin.load(id);
    assert.match(code, /01-start\\/page\.mdx/);
    assert.match(code, /baseUrl: "\/guide"/);
    assert.doesNotMatch(code, /note\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
