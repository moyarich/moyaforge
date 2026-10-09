import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export interface MoyaForgeViteOptions {
  root?: string;
  collections?: Record<string, { dir: string; baseUrl: string }>;
}
type Plugin = {
  name: string;
  enforce: "pre";
  resolveId: (id: string) => string | undefined;
  load: (id: string) => string | undefined;
  handleHotUpdate: (ctx: { file: string; server: { moduleGraph: { getModuleById: (id: string) => unknown; invalidateModule: (mod: any) => void }; ws: { send: (msg: {type: string}) => void } } }) => void;
};
const virtual = "virtual:moyaforge/pages";
const resolved = "\0" + virtual;

function walk(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
      item.isDirectory() ? walk(join(dir, item.name)) : /\.mdx?$/.test(item.name) ? [join(dir, item.name)] : []);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
function generate(root: string, collections: NonNullable<MoyaForgeViteOptions["collections"]>): string {
  const imports: string[] = [];
  const configs: string[] = [];
  for (const [collection, definition] of Object.entries(collections)) {
    const base = resolve(root, definition.dir);
    const items = walk(base).filter((file) => /(^|\/)page\.mdx?$/.test(file));
    const modules = items.map((file) => {
      const index = imports.length;
      imports.push(`import * as page${index} from ${JSON.stringify(file.replace(/\\/g, "/"))};`);
      return `${JSON.stringify(relative(base, file).replace(/\\/g, "/"))}: { default: page${index}.default, frontmatter: page${index}.frontmatter ?? page${index}.meta ?? {} }`;
    });
    configs.push(`${JSON.stringify(collection)}: { dir: ${JSON.stringify(definition.dir)}, baseUrl: ${JSON.stringify(definition.baseUrl)}, modules: { ${modules.join(",")} } }`);
  }
  return `${imports.join("\n")}\nexport const collections = { ${configs.join(",")} };\n`;
}
/**
 * Vite virtual manifest plugin. Pair with an MDX compiler plugin in the host Vite config.
 * Does not take ownership of the host router or React plugin.
 */
export function moyaforgeVite(options: MoyaForgeViteOptions = {}): Plugin {
  const root = resolve(options.root ?? process.cwd());
  const collections = options.collections ?? { docs: { dir: "docs", baseUrl: "/docs" } };
  return {
    name: "moyaforge:pages", enforce: "pre",
    resolveId: (id) => id === virtual ? resolved : undefined,
    load: (id) => id === resolved ? generate(root, collections) : undefined,
    handleHotUpdate: (ctx) => {
      if (!/\.mdx?$/.test(ctx.file)) return;
      const module = ctx.server.moduleGraph.getModuleById(resolved);
      if (module) ctx.server.moduleGraph.invalidateModule(module);
      ctx.server.ws.send({ type: "full-reload" });
    },
  };
}
