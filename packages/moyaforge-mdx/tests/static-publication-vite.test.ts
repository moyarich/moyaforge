import { expect, test } from "vitest";
import { mdxRegistryPlugin } from "../src/vite/plugin.js";
import { buildPageRegistry } from "../src/registry/registry.js";

test("Vite emits deterministic publication assets from the shared registry", async () => {
  const registry = buildPageRegistry({
    docs: [
      { file: "page.md", frontmatter: { title: "Home" } },
      { file: "hidden/page.md", frontmatter: { title: "Hidden", navigation: "hidden" } },
    ],
  });
  const discovery = {
    registry,
    inputs: {},
    headings: { "docs/page.md": [{ id: "start", value: "Start", depth: 2 }] },
    metadata: {},
  };
  const plugin = mdxRegistryPlugin({
    root: ".",
    registry: { sources: { docs: { base: "docs", include: ["**/*.md"] } } },
    discovery: { get: async () => discovery, invalidate() {} },
    publication: { origin: "https://example.com/project", title: "Docs" },
  });
  const assets = new Map<string, string>();
  const generate = plugin.generateBundle;
  if (typeof generate !== "function") throw Error("missing generateBundle hook");
  await generate.call(
    { emitFile(asset: { fileName: string; source: string }) {
      assets.set(asset.fileName, asset.source);
      return asset.fileName;
    } } as never,
    {} as never,
    {} as never,
    false,
  );

  expect([...assets.keys()].sort()).toEqual([
    "content-metadata.json",
    "llms.txt",
    "search-index.json",
  ]);
  expect(assets.get("llms.txt")).toContain(
    "[Home](https://example.com/project/docs)",
  );
  expect(assets.get("llms.txt")).not.toContain("Hidden");
  expect(JSON.parse(assets.get("search-index.json")!)).toMatchObject([
    { title: "Home", headings: [{ id: "start", label: "Start" }] },
  ]);
});
