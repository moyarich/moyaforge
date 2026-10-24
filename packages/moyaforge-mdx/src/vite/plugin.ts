import { createContentManifest } from "../content/manifest.js";
import {
  discoverContent,
  type ContentSourcesConfig,
} from "../content/discovery.js";
import { dirname, join, relative, resolve, sep } from "node:path";
import { existsSync } from "node:fs";
import type { Plugin } from "vite";

export interface RegistrySource {
  base: string;
  include: readonly string[];
  /** Include ordinary Markdown files in addition to directory landing pages. */
  pageFiles?: "canonical" | "all";
  exclude?: readonly string[];
  navigation?: { label?: string; order?: number };
  metadata?: readonly string[];
}
export interface RegistryConfiguration extends ContentSourcesConfig {
  sources: Record<string, RegistrySource>;
}
export interface RegistryPluginOptions {
  registry: RegistryConfiguration;
  root: string;
  /** Repository root for generated GitHub edit paths; discovered from .git when omitted. */
  repositoryRoot?: string;
}

const publicId = "virtual:moyaforge-mdx/registry";
const resolvedId = "\0" + publicId;
const lazyPublicId = "virtual:moyaforge-mdx/lazy-registry";
const lazyResolvedId = "\0" + lazyPublicId;
const metadataPublicId = "virtual:moyaforge-mdx/metadata";
const metadataResolvedId = "\0" + metadataPublicId;

/** Optional Vite adapter: source ownership remains with the application's registry.config.ts. */
export function mdxRegistryPlugin({
  registry,
  root,
  repositoryRoot,
}: RegistryPluginOptions): Plugin {
  const appRoot = resolve(root);
  const findRepositoryRoot = () => {
    let directory = appRoot;
    while (true) {
      if (existsSync(join(directory, ".git"))) return directory;
      const parent = dirname(directory);
      if (parent === directory) return undefined;
      directory = parent;
    }
  };
  const editRoot = repositoryRoot
    ? resolve(appRoot, repositoryRoot)
    : findRepositoryRoot();
  const withSourcePath = (page: { source: string; file: string }) => {
    if (!editRoot) return page;
    const absolute = resolve(
      appRoot,
      registry.sources[page.source].base,
      page.file,
    );
    const path = relative(editRoot, absolute).split(sep).join("/");
    return path.startsWith("../") || path === ".."
      ? page
      : { ...page, sourcePath: path };
  };
  const directories = Object.values(registry.sources).map((source) =>
    resolve(appRoot, source.base),
  );
  // Share one metadata discovery across all virtual modules in a build.
  // Re-reading every MDX file for each module duplicates transient allocations.
  let discovery: ReturnType<typeof discoverContent> | undefined;
  const getDiscovery = () => (discovery ??= discoverContent(registry, appRoot));
  const discover = async (lazyOnly: boolean) => {
    const imports: string[] = [];
    const sources: string[] = [];
    let index = 0;
    const { registry: normalized } = await getDiscovery();
    for (const [name, source] of Object.entries(registry.sources)) {
      const base = resolve(appRoot, source.base);
      const pages: string[] = [];
      const lazyPages: string[] = [];
      for (const page of normalized.routes.filter(
        (page) => page.source === name,
      )) {
        const file = resolve(base, page.file).replaceAll("\\", "/");
        const id = index++;
        if (!lazyOnly)
          imports.push(`import * as page${id} from ${JSON.stringify(file)};`);
        const key = JSON.stringify(page.file);
        if (!lazyOnly) pages.push(`${key}: page${id}`);
        lazyPages.push(`${key}: () => import(${JSON.stringify(file)})`);
      }
      sources.push(
        `${JSON.stringify(name)}: { ${lazyOnly ? "" : `pages: { ${pages.join(",")} }, `}lazyPages: { ${lazyPages.join(",")} } }`,
      );
    }
    return `${imports.join("\n")}\nexport const sources = { ${sources.join(",")} };\n`;
  };
  return {
    name: "moyaforge-mdx:registry",
    enforce: "pre",
    resolveId(id) {
      if (id === publicId) return resolvedId;
      if (id === lazyPublicId) return lazyResolvedId;
      if (id === metadataPublicId) return metadataResolvedId;
    },
    async load(id) {
      if (id === resolvedId) return discover(false);
      if (id === lazyResolvedId) return discover(true);
      if (id === metadataResolvedId) {
        const {
          registry: pages,
          inputs,
          headings,
          metadata,
        } = await getDiscovery();
        return `export const manifest = ${JSON.stringify(createContentManifest({ registry: pages, headings }).map(withSourcePath))};\nexport const sources = ${JSON.stringify(inputs)};\nexport const pages = ${JSON.stringify(pages.pages.map(withSourcePath))};\nexport const routes = ${JSON.stringify(pages.routes.map(withSourcePath))};\nexport const navigation = ${JSON.stringify(pages.navigation.map(withSourcePath))};\nexport const tree = ${JSON.stringify(pages.tree)};\nexport const headings = ${JSON.stringify(headings)};\nexport const sourceMetadata = ${JSON.stringify(metadata)};\n`;
      }
    },
    configureServer(server) {
      server.watcher.add(directories);
      const update = (file: string) => {
        const absolute = resolve(file);
        if (
          !directories.some(
            (dir) => absolute === dir || absolute.startsWith(dir + sep),
          )
        )
          return;
        discovery = undefined;
        for (const id of [resolvedId, lazyResolvedId, metadataResolvedId]) {
          const module = server.moduleGraph.getModuleById(id);
          if (module) server.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", update);
      server.watcher.on("change", update);
      server.watcher.on("unlink", update);
    },
  };
}
