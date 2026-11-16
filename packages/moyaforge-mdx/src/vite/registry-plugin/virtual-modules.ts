import { createContentManifest } from "../../content/manifest.js";
import type { DiscoveredContent } from "../../content/discovery.js";
import { dirname, join, relative, resolve, sep } from "node:path";
import { existsSync } from "node:fs";
import type { RegistryConfiguration } from "./options.js";

export const virtualModules = {
  registry: "virtual:moyaforge-mdx/registry",
  lazyRegistry: "virtual:moyaforge-mdx/lazy-registry",
  metadata: "virtual:moyaforge-mdx/metadata",
} as const;

export const virtualModuleIds: string[] = Object.values(virtualModules);
export const resolvedModuleIds = virtualModuleIds.map((id) => "\0" + id);

export function findRepositoryRoot(root: string): string | undefined {
  let directory = root;
  while (true) {
    if (existsSync(join(directory, ".git"))) return directory;
    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

function withSourcePath(
  page: { source: string; file: string },
  registry: RegistryConfiguration,
  appRoot: string,
  repositoryRoot?: string,
) {
  if (!repositoryRoot) return page;
  const absolute = resolve(appRoot, registry.sources[page.source].base, page.file);
  const path = relative(repositoryRoot, absolute).split(sep).join("/");
  return path.startsWith("../") || path === ".."
    ? page
    : { ...page, sourcePath: path };
}

/** Generate a page registry with eager imports, lazy loaders, or both. */
export function createPageModule(
  content: DiscoveredContent,
  registry: RegistryConfiguration,
  appRoot: string,
  lazyOnly: boolean,
): string {
  const imports: string[] = [];
  const sources: string[] = [];
  let nextId = 0;

  for (const [name, source] of Object.entries(registry.sources)) {
    const base = resolve(appRoot, source.base);
    const pages: string[] = [];
    const lazyPages: string[] = [];

    for (const page of content.registry.routes) {
      if (page.source !== name) continue;
      const file = JSON.stringify(resolve(base, page.file).replaceAll("\\", "/"));
      const key = JSON.stringify(page.file);
      const id = nextId++;

      if (!lazyOnly) {
        imports.push(`import * as page${id} from ${file};`);
        pages.push(`${key}: page${id}`);
      }
      lazyPages.push(`${key}: () => import(${file})`);
    }

    const fields = [
      ...(!lazyOnly ? [`pages: { ${pages.join(", ")} }`] : []),
      `lazyPages: { ${lazyPages.join(", ")} }`,
    ];
    sources.push(`${JSON.stringify(name)}: { ${fields.join(", ")} }`);
  }

  return [...imports, `export const sources = { ${sources.join(", ")} };`, ""].join("\n");
}

/** Serialize build-time content without loading MDX page components. */
export function createMetadataModule(
  content: DiscoveredContent,
  registry: RegistryConfiguration,
  appRoot: string,
  repositoryRoot?: string,
): string {
  const { registry: pages, inputs, headings, metadata } = content;
  const source = (page: { source: string; file: string }) =>
    withSourcePath(page, registry, appRoot, repositoryRoot);

  const exports = {
    manifest: createContentManifest({ registry: pages, headings }).map(source),
    sources: inputs,
    pages: pages.pages.map(source),
    routes: pages.routes.map(source),
    navigation: pages.navigation.map(source),
    tree: pages.tree,
    headings,
    sourceMetadata: metadata,
  };

  return Object.entries(exports)
    .map(([name, value]) => `export const ${name} = ${JSON.stringify(value)};`)
    .join("\n") + "\n";
}
