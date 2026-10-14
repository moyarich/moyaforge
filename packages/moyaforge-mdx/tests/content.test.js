import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parsePageFrontmatter, discoverContent } from "../dist/content.js";
import { mdxRegistryPlugin } from "../dist/vite.js";

test("YAML metadata is parsed for Markdown and MDX without JS exports", () => {
  assert.deepEqual(
    parsePageFrontmatter(
      "---\ntitle: API\nnavigation: hidden\ntoc: false\n---\n# Hello",
      "page.md",
    ),
    {
      title: "API",
      navigation: "hidden",
      toc: false,
    },
  );
  assert.deepEqual(parsePageFrontmatter("# Nothing", "page.mdx"), {});
  assert.throws(
    () =>
      parsePageFrontmatter("---\ntitle: A\ntitle: B\n---\n", "docs/page.md"),
    /docs\/page.md: invalid YAML/,
  );
  assert.throws(
    () => parsePageFrontmatter("---\ntitle: Unclosed", "docs/page.md"),
    /unterminated YAML/,
  );
});

test("normalized metadata manifest excludes disabled pages and compiled modules", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-metadata-"));
  try {
    await mkdir(join(root, "docs", "01-guide"), { recursive: true });
    await mkdir(join(root, "docs", "02-disabled"), { recursive: true });
    await writeFile(
      join(root, "docs", "page.md"),
      "---\ntitle: Docs\n---\n# Welcome",
    );
    await writeFile(
      join(root, "docs", "01-guide", "page.mdx"),
      "---\ntitle: Guide\nnavigation: hidden\n---\n# Guide",
    );
    await writeFile(
      join(root, "docs", "02-disabled", "page.md"),
      "---\nnavigation: disabled\n---\n# Disabled",
    );
    const config = {
      sources: {
        docs: { base: "docs", include: ["**/page.md", "**/page.mdx"] },
      },
    };
    const result = await discoverContent(config, root);
    assert.deepEqual(
      result.registry.routes.map((page) => page.path),
      ["/docs", "/docs/guide"],
    );
    assert.deepEqual(
      result.registry.navigation.map((page) => page.path),
      ["/docs"],
    );
    const plugin = mdxRegistryPlugin({ root, registry: config });
    const id = plugin.resolveId.call({}, "virtual:moyaforge-mdx/metadata");
    assert.ok(id);
    const code = await plugin.load.call({}, id);
    assert.doesNotMatch(code, /import \* as page|\(\) => import\(/);
    assert.match(code, /"title":"Guide"/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
