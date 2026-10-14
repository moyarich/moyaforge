import { resolve } from "node:path";
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
 * Vite virtual manifest plugin. Pair with an MDX compiler plugin in the host Vite config.
 * Does not take ownership of the host router or React plugin.
 */
export function moyaforgeVite(options: MoyaForgeViteOptions = {}): Plugin {
  const root = resolve(options.root ?? process.cwd());
  const collections = options.collections ?? {
    docs: { dir: "docs", baseUrl: "/docs" },
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
    handleHotUpdate: (ctx) => {
      if (!/\.mdx?$/.test(ctx.file)) return;
      for (const id of [resolved, lazyResolved]) {
        const module = ctx.server.moduleGraph.getModuleById(id);
        if (module) ctx.server.moduleGraph.invalidateModule(module);
      }
      ctx.server.ws.send({ type: "full-reload" });
    },
  };
}
