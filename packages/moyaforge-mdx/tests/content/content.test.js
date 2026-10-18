import { test } from "vitest";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parsePageFrontmatter,
  discoverContent,
} from "../../dist/content/discovery.js";
import { mdxRegistryPlugin } from "../../dist/vite/plugin.js";

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

test("project TOC defaults apply to Markdown and MDX with page overrides", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-toc-config-"));
  try {
    await mkdir(join(root, "docs", "01-guide"), { recursive: true });
    await mkdir(join(root, "docs", "02-hidden-toc"), { recursive: true });
    await writeFile(join(root, "docs", "page.md"), "# Home\n\n## Intro");
    await writeFile(
      join(root, "docs", "01-guide", "page.mdx"),
      "---\ntoc:\n  placement: inline\n---\n# Guide\n\n## Intro",
    );
    await writeFile(
      join(root, "docs", "02-hidden-toc", "page.md"),
      "---\ntoc: false\n---\n# Hidden TOC\n\n## Intro",
    );
    const config = {
      toc: { placement: "sidebar", minDepth: 2, maxDepth: 3 },
      sources: {
        docs: { base: "docs", include: ["**/page.md", "**/page.mdx"] },
      },
    };
    const discovered = await discoverContent(config, root);
    assert.deepEqual(discovered.registry.byPath.get("/docs").toc, config.toc);
    assert.deepEqual(discovered.registry.byPath.get("/docs/guide").toc, {
      placement: "inline",
    });
    assert.equal(discovered.registry.byPath.get("/docs/hidden-toc").toc, false);
    const plugin = mdxRegistryPlugin({ root, registry: config });
    const id = plugin.resolveId.call({}, "virtual:moyaforge-mdx/metadata");
    const module = await plugin.load.call({}, id);
    assert.match(module, /"placement":"sidebar"/);
    assert.match(module, /"placement":"inline"/);
    assert.match(module, /"toc":false/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("missing configured source directories fail while empty existing sources are valid", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-source-check-"));
  try {
    const missing = {
      sources: { docs: { base: "missing", include: ["**/page.md"] } },
    };
    await assert.rejects(
      discoverContent(missing, root),
      /Content source "docs": directory does not exist: .*missing/,
    );
    await writeFile(join(root, "not-a-directory"), "");
    await assert.rejects(
      discoverContent(
        {
          sources: {
            docs: { base: "not-a-directory", include: ["**/page.md"] },
          },
        },
        root,
      ),
      /Content source "docs": expected directory:/,
    );
    await mkdir(join(root, "empty"));
    const discovered = await discoverContent(
      { sources: { docs: { base: "empty", include: ["**/page.md"] } } },
      root,
    );
    assert.deepEqual(discovered.inputs.docs, []);
    assert.deepEqual(discovered.registry.routes, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("configured package identity JSON is separate from page navigation metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-source-identity-"));
  try {
    await mkdir(join(root, "packages", "example"), { recursive: true });
    await writeFile(
      join(root, "packages", "example", "package.json"),
      JSON.stringify({ name: "@example/component", navigation: "disabled" }),
    );
    await writeFile(
      join(root, "packages", "example", "page.mdx"),
      ["---", "title: Component docs", "---", "# Component"].join("\n"),
    );
    const config = {
      sources: {
        packages: {
          base: "packages",
          include: ["*/page.mdx"],
          metadata: ["*/package.json"],
        },
      },
    };
    const result = await discoverContent(config, root);
    assert.equal(
      result.metadata.packages["example/package.json"].name,
      "@example/component",
    );
    assert.equal(result.registry.routes[0].navigation, "visible");
    assert.equal(result.registry.routes[0].title, "Component docs");
    const plugin = mdxRegistryPlugin({ registry: config, root });
    const id = plugin.resolveId.call({}, "virtual:moyaforge-mdx/metadata");
    const code = await plugin.load.call({}, id);
    assert.match(code, /sourceMetadata/);
    assert.ok(code.includes("@example/component"));
    await writeFile(
      join(root, "packages", "example", "package.json"),
      "{ broken",
    );
    await assert.rejects(
      discoverContent(config, root),
      /invalid JSON source metadata/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
