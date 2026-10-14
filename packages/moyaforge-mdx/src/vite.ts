import { resolve, relative, sep } from "node:path";
import { glob } from "tinyglobby";
import type { Plugin } from "vite";

export interface RegistrySource {
  base: string;
  include: readonly string[];
  exclude?: readonly string[];
  navigation?: { label?: string; order?: number };
  metadata?: readonly string[];
}
export interface RegistryConfiguration {
  sources: Record<string, RegistrySource>;
}
export interface RegistryPluginOptions {
  registry: RegistryConfiguration;
  root: string;
}

const publicId = "virtual:moyaforge-mdx/registry";
const resolvedId = "\0" + publicId;

/** Optional Vite adapter: source ownership remains with the application's registry.config.ts. */
export function mdxRegistryPlugin({
  registry,
  root,
}: RegistryPluginOptions): Plugin {
  const appRoot = resolve(root);
  const directories = Object.values(registry.sources).map((source) =>
    resolve(appRoot, source.base),
  );
  const discover = async (lazyOnly: boolean) => {
    const imports: string[] = [];
    const sources: string[] = [];
    let index = 0;
    for (const [name, source] of Object.entries(registry.sources)) {
      const base = resolve(appRoot, source.base);
      const entries = await glob([...source.include], {
        cwd: base,
        ignore: source.exclude ? [...source.exclude] : [],
        absolute: true,
        onlyFiles: true,
      });
      const pages: string[] = [];
      const lazyPages: string[] = [];
      for (const file of entries.sort()) {
        const id = index++;
        if (!lazyOnly) imports.push(
          `import * as page${id} from ${JSON.stringify(file.split(sep).join("/"))};`,
        );
        const key = JSON.stringify(relative(base, file).split(sep).join("/"));
        if (!lazyOnly) pages.push(`${key}: page${id}`);
        lazyPages.push(
          `${key}: () => import(${JSON.stringify(file.split(sep).join("/"))})`,
        );
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
    },
    async load(id) {
      if (id === resolvedId) return discover(false);
      if (id === lazyResolvedId) return discover(true);
    },
    configureServer(server) {
      server.watcher.add(directories);
      const update = (file: string) => {
        const absolute = resolve(file);
        if (!directories.some((dir) => absolute.startsWith(dir + sep))) return;
        for (const id of [resolvedId, lazyResolvedId]) {
          const module = server.moduleGraph.getModuleById(id);
          if (module) server.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", update);
      server.watcher.on("unlink", update);
    },
  };
}
