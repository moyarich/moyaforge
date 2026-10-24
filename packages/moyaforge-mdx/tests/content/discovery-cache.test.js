import assert from "node:assert/strict";
import { test } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createContentDiscovery } from "../../dist/content/discovery.js";

test("shared discovery reuses metadata until invalidated", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-discovery-cache-"));
  try {
    await mkdir(join(root, "docs"));
    const file = join(root, "docs", "page.md");
    await writeFile(file, "---\ntitle: Before\n---\n# Before");
    const discovery = createContentDiscovery(
      { sources: { docs: { base: "docs", include: ["**/*.md"] } } },
      root,
    );
    const [first, same] = await Promise.all([discovery.get(), discovery.get()]);
    assert.strictEqual(first, same);
    assert.equal(first.registry.routes[0].title, "Before");
    await writeFile(file, "---\ntitle: After\n---\n# After");
    assert.strictEqual(await discovery.get(), first);
    discovery.invalidate();
    const updated = await discovery.get();
    assert.notStrictEqual(updated, first);
    assert.equal(updated.registry.routes[0].title, "After");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
