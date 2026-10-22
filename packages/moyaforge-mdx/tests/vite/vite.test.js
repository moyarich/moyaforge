import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "vitest";
import { mdxRegistryPlugin } from "../../dist/vite/plugin.js";

test("lazy registry emits only dynamic imports, while existing registry stays compatible", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-mdx-"));
  try {
    await mkdir(join(root, "docs", "01-guide"), { recursive: true });
    await writeFile(join(root, "docs", "01-guide", "page.mdx"), "# Guide");
    const plugin = mdxRegistryPlugin({
      root,
      registry: {
        sources: { docs: { base: "docs", include: ["**/page.mdx"] } },
      },
    });
    const lazyId = plugin.resolveId.call(
      {},
      "virtual:moyaforge-mdx/lazy-registry",
    );
    const legacyId = plugin.resolveId.call(
      {},
      "virtual:moyaforge-mdx/registry",
    );
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

test("broad globs expose only canonical page.md and page.mdx modules", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-pages-only-"));
  try {
    await mkdir(join(root, "docs", "01-guide"), { recursive: true });
    await writeFile(join(root, "docs", "page.md"), "# Home");
    await writeFile(join(root, "docs", "01-guide", "page.mdx"), "# Guide");
    await writeFile(join(root, "docs", "README.md"), "# Internal notes");
    await writeFile(
      join(root, "docs", "01-guide", "notes.mdx"),
      "# Not a page",
    );
    const plugin = mdxRegistryPlugin({
      root,
      registry: {
        sources: { docs: { base: "docs", include: ["**/*.md", "**/*.mdx"] } },
      },
    });
    for (const name of ["registry", "lazy-registry"]) {
      const id = plugin.resolveId.call({}, `virtual:moyaforge-mdx/${name}`);
      const code = await plugin.load.call({}, id);
      assert.match(code, /page\.md/);
      assert.match(code, /page\.mdx/);
      assert.doesNotMatch(code, /README\.md|notes\.mdx/);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Vite registries load hidden routes but never load disabled pages", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-route-pages-"));
  try {
    for (const folder of ["01-visible", "02-hidden", "03-disabled"]) {
      await mkdir(join(root, "docs", folder), { recursive: true });
    }
    await writeFile(join(root, "docs", "01-visible", "page.md"), "# Visible");
    await writeFile(
      join(root, "docs", "02-hidden", "page.mdx"),
      "---\nnavigation: hidden\n---\n# Hidden",
    );
    await writeFile(
      join(root, "docs", "03-disabled", "page.mdx"),
      "---\nnavigation: disabled\n---\n# Disabled",
    );
    const plugin = mdxRegistryPlugin({
      root,
      registry: {
        sources: {
          docs: { base: "docs", include: ["**/page.md", "**/page.mdx"] },
        },
      },
    });
    for (const name of ["registry", "lazy-registry"]) {
      const id = plugin.resolveId.call({}, `virtual:moyaforge-mdx/${name}`);
      const code = await plugin.load.call({}, id);
      assert.match(code, /01-visible\/page\.md/);
      assert.match(code, /02-hidden\/page\.mdx/);
      assert.doesNotMatch(code, /03-disabled\/page\.mdx/);
    }
    const id = plugin.resolveId.call({}, "virtual:moyaforge-mdx/metadata");
    const metadata = await plugin.load.call({}, id);
    assert.match(metadata, /03-disabled\/page\.mdx/); // inventory retains disabled pages
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("virtual registries share discovery while reloading after source changes", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-registry-cache-"));
  try {
    const directory = join(root, "docs");
    await mkdir(directory, { recursive: true });
    const file = join(directory, "page.mdx");
    await writeFile(file, "---\ntitle: Original\n---\n# Original");
    const plugin = mdxRegistryPlugin({
      root,
      registry: {
        sources: { docs: { base: "docs", include: ["**/page.mdx"] } },
      },
    });
    const metadataId = plugin.resolveId.call(
      {},
      "virtual:moyaforge-mdx/metadata",
    );
    const lazyId = plugin.resolveId.call(
      {},
      "virtual:moyaforge-mdx/lazy-registry",
    );
    const first = await plugin.load.call({}, metadataId);
    assert.match(first, /Original/);
    await writeFile(file, "---\ntitle: Updated\n---\n# Updated");
    // Discovery is cached across module loads until Vite invalidates it.
    assert.equal(await plugin.load.call({}, metadataId), first);
    assert.match(await plugin.load.call({}, lazyId), /lazyPages/);
    const invalidated = [];
    const listeners = new Map();
    plugin.configureServer({
      watcher: {
        add() {},
        on(name, listener) {
          listeners.set(name, listener);
        },
      },
      moduleGraph: {
        getModuleById(id) {
          return { id };
        },
        invalidateModule(module) {
          invalidated.push(module.id);
        },
      },
      ws: { send() {} },
    });
    listeners.get("change")(file);
    const second = await plugin.load.call({}, metadataId);
    assert.match(second, /Updated/);
    assert.notEqual(first, second);
    assert.equal(invalidated.length, 3);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("source-directory watcher events invalidate cached metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-dir-watch-"));
  try {
    const directory = join(root, "docs");
    await mkdir(directory);
    await writeFile(join(directory, "page.mdx"), "# First");
    const plugin = mdxRegistryPlugin({
      root,
      registry: {
        sources: { docs: { base: "docs", include: ["**/page.mdx"] } },
      },
    });
    const id = plugin.resolveId("virtual:moyaforge-mdx/metadata");
    assert.match(await plugin.load(id), /First/);
    let onChange;
    let reloads = 0;
    plugin.configureServer({
      watcher: {
        add() {},
        on(event, listener) {
          if (event === "change") onChange = listener;
        },
      },
      moduleGraph: {
        getModuleById() {
          return null;
        },
      },
      ws: {
        send() {
          reloads++;
        },
      },
    });
    await writeFile(join(directory, "page.mdx"), "# Second");
    onChange(directory);
    assert.match(await plugin.load(id), /Second/);
    assert.equal(reloads, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
