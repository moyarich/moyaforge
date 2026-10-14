import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { mdxRegistryPlugin } from "../dist/vite.js";

test("lazy registry emits only dynamic imports, while existing registry stays compatible", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-mdx-"));
  try {
    await mkdir(join(root, "docs", "01-guide"), { recursive: true });
    await writeFile(join(root, "docs", "01-guide", "page.mdx"), "# Guide");
    const plugin = mdxRegistryPlugin({
      root,
      registry: { sources: { docs: { base: "docs", include: ["**/page.mdx"] } } },
    });
    const lazyId = plugin.resolveId.call({}, "virtual:moyaforge-mdx/lazy-registry");
    const legacyId = plugin.resolveId.call({}, "virtual:moyaforge-mdx/registry");
    assert.ok(lazyId);
    assert.ok(legacyId);
    const lazy = await plugin.load.call({}, lazyId);
    const legacy = await plugin.load.call({}, legacyId);
    assert.match(lazy, /lazyPages/);
    assert.match(lazy, /\(\) => import\(/);
    assert.doesNotMatch(lazy, /import \* as page/);
    assert.doesNotMatch(lazy, /pages: \{/);
    assert.match(legacy, /import \* as page/);
    assert.match(legacy, /pages: \{/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
