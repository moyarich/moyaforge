import { expect, test } from "vitest";
import { build } from "vite";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mdxRegistryPlugin } from "../src/vite/plugin.js";
import { buildPageRegistry } from "../src/registry/registry.js";

test("Vite emits deterministic publication assets from canonical registry", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-publication-"));
  try {
    await writeFile(join(root, "index.html"), '<script type="module" src="/main.js"></script>');
    await writeFile(join(root, "main.js"), "export default true;");
    await mkdir(join(root, "docs", "hidden"), { recursive: true });
    await writeFile(join(root, "docs", "page.md"), "---\\ntitle: Home\\n---\\n# Home\\nBody text.\\n".replaceAll("\\n", "\n"));
    await writeFile(join(root, "docs", "hidden", "page.md"), "# Hidden\\n");
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
      root,
      registry: { sources: { docs: { base: "docs", include: ["**/*.md"] } } },
      discovery: { get: async () => discovery, invalidate() {} },
      publication: { origin: "https://example.com/project", title: "Docs" },
    });
    await build({
      configFile: false,
      root,
      publicDir: false,
      logLevel: "silent",
      plugins: [plugin],
      build: { outDir: join(root, "dist"), emptyOutDir: true },
    });
    const output = join(root, "dist");
    expect(await readFile(join(output, "markdown/docs.md"), "utf8")).toBe("# Home\nBody text.\n");
    const llms = await readFile(join(output, "llms.txt"), "utf8");
    const search = JSON.parse(await readFile(join(output, "search-index.json"), "utf8"));
    const metadata = JSON.parse(await readFile(join(output, "content-metadata.json"), "utf8"));

    expect(llms).toBe("# Docs\n\n- [Home](https://example.com/project/docs)\n");
    expect(search).toMatchObject([
      { title: "Home", headings: [{ id: "start", label: "Start" }] },
    ]);
    expect(metadata.map((page: { path: string }) => page.path)).toEqual(["/docs"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
