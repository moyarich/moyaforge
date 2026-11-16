import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createContentManifest } from "../../content/manifest.js";
import {
  createStaticPublication,
  type StaticPublicationOptions,
} from "../../content/static-publication.js";
import type { DiscoveredContent } from "../../content/discovery.js";
import type { RegistryConfiguration } from "./options.js";

const frontmatter = /^\uFEFF?---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)(?:\r?\n|$)/;

type EmitAsset = (asset: {
  type: "asset";
  fileName: string;
  source: string;
}) => unknown;

export async function emitStaticPublication(
  emitFile: EmitAsset,
  content: DiscoveredContent,
  registry: RegistryConfiguration,
  appRoot: string,
  options: StaticPublicationOptions,
): Promise<void> {
  const { registry: pages, headings } = content;
  const output = createStaticPublication(
    createContentManifest({ registry: pages, headings }),
    options,
  );
  const published = new Set(output.metadata.map((page) => page.path));
  const textByPath = new Map<string, string>();

  for (const page of pages.routes) {
    if (!published.has(page.path)) continue;

    const source = registry.sources[page.source];
    const raw = await readFile(resolve(appRoot, source.base, page.file), "utf8");
    const markdown = raw.replace(frontmatter, "");
    textByPath.set(page.path, markdown);

    const extension = page.file.endsWith(".mdx") ? ".mdx" : ".md";
    emitFile({
      type: "asset",
      fileName: `markdown/${page.path.replace(/^\/+/, "")}${extension}`,
      source: markdown,
    });
  }

  const bodyByUrl = new Map(
    output.metadata.map((page) => [page.url, textByPath.get(page.path) ?? ""]),
  );
  const searchIndex = output.searchIndex.map((entry) => ({
    ...entry,
    content: bodyByUrl.get(entry.url) ?? "",
  }));

  const assets = {
    "llms.txt": output.llmsTxt,
    "search-index.json": JSON.stringify(searchIndex, null, 2) + "\n",
    "content-metadata.json": JSON.stringify(output.metadata, null, 2) + "\n",
  };

  for (const [fileName, source] of Object.entries(assets)) {
    emitFile({ type: "asset", fileName, source });
  }
}
