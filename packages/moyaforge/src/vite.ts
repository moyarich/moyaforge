import { isAbsolute, relative, resolve, sep } from "node:path";
import { discoverSourceFilesSync } from "@moyarich/moyaforge-mdx/source-files";

export interface MoyaForgeViteOptions {
  root?: string;
  collections?: Record<string, { dir: string; baseUrl: string }>;
}
type Plugin = {
  name: string;
  enforce: "pre";
  resolveId: (id: string) => string | undefined;
  load: (id: string) => string | undefined;
  configureServer: (server: {
    watcher: { on: (event: "add" | "unlink", cb: (file: string) => void) => void };
    moduleGraph: { getModuleById: (id: string) => unknown; invalidateModule: (mod: any) => void };
    ws: { send: (msg: { type: string }) => void };
  }) => void;
  handleHotUpdate: (ctx: {
    file: string;
    server: {
      moduleGraph: {
        getModuleById: (id: string) => unknown;
        invalidateModule: (mod: any) => void;
      };
      ws: { send: (msg: { type: string }) => void };
    };
  }) => void;
};
const virtual = "virtual:moyaforge/pages";
const resolved = "\0" + virtual;
const lazyVirtual = "virtual:moyaforge/lazy-pages";
const lazyResolved = "\0" + lazyVirtual;

function generate(
  root: string,
  collections: NonNullable<MoyaForgeViteOptions["collections"]>,
  lazyOnly = false,
): string {
  const imports: string[] = [];
  const configs: string[] = [];
  for (const [collection, definition] of Object.entries(collections)) {
    const base = resolve(root, definition.dir);
    const items = discoverSourceFilesSync(base);
    const modules = items.map(({ absolute, relative: sourceFile }) => {
      const index = imports.length;
      if (lazyOnly)
        return `${JSON.stringify(sourceFile)}: () => import(${JSON.stringify(absolute)})`;
      imports.push(
        `import * as page${index} from ${JSON.stringify(absolute)};`,
      );
      return `${JSON.stringify(sourceFile)}: { default: page${index}.default, frontmatter: page${index}.frontmatter ?? page${index}.meta ?? {} }`;
    });
    configs.push(
      `${JSON.stringify(collection)}: { dir: ${JSON.stringify(definition.dir)}, baseUrl: ${JSON.stringify(definition.baseUrl)}, modules: { ${modules.join(",")} } }`,
    );
  }
  return `${imports.join("\n")}\nexport const collections = { ${configs.join(",")} };\n`;
}
/**
 * @deprecated Prefer `mdxRegistryPlugin` from `@moyarich/moyaforge-mdx/vite`
 * and its metadata/lazy-registry virtual modules for new integrations.
 * This legacy collection-based manifest remains for existing consumers.
 * Pair with an MDX compiler plugin in the host Vite config.
 * Does not take ownership of the host router or React plugin.
 */
export function moyaforgeVite(options: MoyaForgeViteOptions = {}): Plugin {
  const root = resolve(options.root ?? process.cwd());
  const collections = options.collections ?? {
    docs: { dir: "docs", baseUrl: "/docs" },
  };
  const sourceRoots = Object.values(collections).map(({ dir }) =>
    resolve(root, dir),
  );
  const isRegisteredPage = (file: string) => {
    if (!/\bpage\.mdx?$/.test(file)) return false;
    const absolute = resolve(file);
    return sourceRoots.some((base) => {
      const path = relative(base, absolute);
      return path !== "" && path !== ".." && !path.startsWith(".." + sep) && !isAbsolute(path);
    });
  };
  const reload = (server: { moduleGraph: { getModuleById: (id: string) => unknown; invalidateModule: (mod: any) => void }; ws: { send: (msg: { type: string }) => void } }) => {
    for (const id of [resolved, lazyResolved]) {
      const module = server.moduleGraph.getModuleById(id);
      if (module) server.moduleGraph.invalidateModule(module);
    }
    server.ws.send({ type: "full-reload" });
  };
  return {
    name: "moyaforge:pages",
    enforce: "pre",
    resolveId: (id) =>
      id === virtual ? resolved : id === lazyVirtual ? lazyResolved : undefined,
    load: (id) =>
      id === resolved
        ? generate(root, collections)
        : id === lazyResolved
          ? generate(root, collections, true)
          : undefined,
    configureServer: (server) => {
      for (const event of ["add", "unlink"] as const)
        server.watcher.on(event, (file) => {
          if (isRegisteredPage(file)) reload(server);
        });
    },
    handleHotUpdate: (ctx) => {
      if (isRegisteredPage(ctx.file)) reload(ctx.server);
    },
  };
}
