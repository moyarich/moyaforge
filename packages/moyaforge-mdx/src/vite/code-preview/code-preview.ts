import { createInlineReactModules } from "./inline-react-modules.js";
import { existsSync, readdirSync, statSync } from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { normalizePath, type Plugin } from "vite";

export interface CodePreviewSource {
  base: string;
}

export interface CodePreviewPage {
  source: string;
  file: string;
}

export interface CodePreviewOptions {
  root: string;
  sources: Readonly<Record<string, CodePreviewSource>>;
  pages: readonly CodePreviewPage[];
  /** Opt-in component directories, absolute or relative to root; searched recursively. */
  componentRoots?: readonly string[];
  resolutionScope?: "global" | "source" | "directory";
  outOfRoot?: "allow" | "skip" | "throw";
}

export interface CodePreviewContext {
  inlineReact: ReturnType<typeof createInlineReactModules>;
  /** Registry key -> absolute file path */
  modules: ReadonlyMap<string, string>;

  /** Absolute file path -> registry key */
  keysByPath: ReadonlyMap<string, string>;

  /** Absolute file path -> source root */
  basesByPath: ReadonlyMap<string, string>;

  resolutionScope: NonNullable<CodePreviewOptions["resolutionScope"]>;
  /** Additional component roots explicitly trusted by the host. */
  componentRoots: readonly string[];
  /** Absolute paths of discovered opt-in components. */
  registeredComponents: ReadonlyMap<string, string>;
  /** Rescan configured component roots when files are added or removed. */
  refreshComponentRoots: () => void;
}

export interface ResolveCodePreviewSourceOptions {
  context: CodePreviewContext;
  reference: string;
  authoredFile: string;
}

export const codePreviewComponentVirtualModuleId =
  "virtual:moyaforge-mdx/code-preview-components";

export const codePreviewSourceVirtualModuleId =
  "virtual:moyaforge-mdx/code-preview-sources";

export const codePreviewPluginName = "moyaforge-mdx:code-preview";

const componentModuleId = `\0${codePreviewComponentVirtualModuleId}`;
const sourceModuleId = `\0${codePreviewSourceVirtualModuleId}`;

const sourceFilePattern = /^[\w-]+(?:\.[\w-]+)*\.(?:tsx|jsx|ts|js|md|mdx|css)$/;
const componentFilePattern = /\.(?:tsx|jsx)$/;

export function createCodePreview({
  root,
  sources,
  pages,
  componentRoots = [],
  resolutionScope = "global",
  outOfRoot = "skip",
}: CodePreviewOptions): CodePreviewContext {
  const roots = new Map(
    Object.entries(sources).map(([name, source]) => [
      name,
      resolve(root, source.base),
    ]),
  );

  const modules = new Map<string, string>();
  const keysByPath = new Map<string, string>();
  const basesByPath = new Map<string, string>();
  const registeredComponents = new Map<string, string>();
  const directories = componentRoots.map((directory) => {
    const absolute = resolve(root, directory);
    if (!existsSync(absolute) || !statSync(absolute).isDirectory())
      throw new Error(`Invalid code-preview component root: ${directory}. Expected an existing directory.`);
    return absolute;
  });

  /** Symlinks are deliberately not followed into unregistered directories. */
  function registerComponentDirectory(directory: string, base: string, index: number) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        registerComponentDirectory(join(directory, entry.name), base, index);
        continue;
      }
      if (!entry.isFile() || !componentFilePattern.test(entry.name)) continue;
      const path = join(directory, entry.name);
      if (keysByPath.has(path)) continue;
      const key = `component-root-${index}/${normalizePath(relative(base, path))}`;
      modules.set(key, path);
      keysByPath.set(path, key);
      basesByPath.set(path, base);
      registeredComponents.set(path, key);
    }
  }

  function refreshComponentRoots() {
    for (const [path, key] of registeredComponents) {
      modules.delete(key);
      if (keysByPath.get(path) === key) {
        keysByPath.delete(path);
        basesByPath.delete(path);
      }
    }
    registeredComponents.clear();
    directories.forEach((directory, index) => {
      if (existsSync(directory))
        registerComponentDirectory(directory, directory, index);
    });
  }

  for (const page of pages) {
    const base = roots.get(page.source);
    if (!base) continue;

    const authoredFile = resolve(base, page.file);
    const directory = dirname(authoredFile);
    const directoryPath = relative(base, directory);

    const outsideRoot =
      directoryPath === ".." ||
      directoryPath.startsWith(`..${sep}`) ||
      isAbsolute(directoryPath);

    if (outsideRoot) {
      if (outOfRoot === "throw") {
        throw new Error(
          `Documentation directory "${directory}" is outside source root "${base}"`,
        );
      }

      if (outOfRoot === "skip") continue;
    }

    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isFile() || !sourceFilePattern.test(entry.name)) {
        continue;
      }

      const path = join(directory, entry.name);

      if (path === authoredFile) continue;

      const key = `${page.source}/${normalizePath(relative(base, path))}`;

      modules.set(key, path);
      keysByPath.set(path, key);
      basesByPath.set(path, base);
    }
  }

  refreshComponentRoots();

  return {
    inlineReact: createInlineReactModules(),
    modules,
    keysByPath,
    basesByPath,
    resolutionScope,
    componentRoots: directories,
    registeredComponents,
    refreshComponentRoots,
  };
}

export function resolveCodePreviewSource({
  context: { keysByPath, basesByPath, resolutionScope, registeredComponents },
  reference,
  authoredFile,
}: ResolveCodePreviewSourceOptions): string | undefined {
  const hash = reference.indexOf("#");
  const pathReference = hash < 0 ? reference : reference.slice(0, hash);
  const namedExport = hash < 0 ? undefined : reference.slice(hash + 1);
  if (namedExport !== undefined && !/^[A-Za-z_$][\w$]*$/.test(namedExport))
    return;
  if (!sourceFilePattern.test(basename(pathReference))) return;

  const authored = resolve(authoredFile);
  const candidate = resolve(dirname(authored), pathReference);
  const key = keysByPath.get(candidate);
  if (!key) return;

  // The host explicitly allowed these directories, regardless of docs scope.
  if (!registeredComponents.has(candidate)) {
    if (resolutionScope === "directory" && dirname(candidate) !== dirname(authored))
      return;
    if (resolutionScope === "source") {
      const base = basesByPath.get(candidate);
      if (!base) return;
      const path = relative(base, authored);
      if (path === ".." || path.startsWith(`..${sep}`) || isAbsolute(path))
        return;
    }
  }

  return namedExport ? `${key}#${namedExport}` : key;
}

export function createCodePreviewPlugin({
  modules,
  inlineReact,
  componentRoots,
  refreshComponentRoots,
}: CodePreviewContext): Plugin {
  return {
    name: codePreviewPluginName,

    configureServer(server) {
      if (!componentRoots.length) return;
      server.watcher.add(componentRoots);
      const refresh = (path: string) => {
        const filename = resolve(path);
        if (!componentFilePattern.test(filename)) return;
        if (!componentRoots.some((base) => {
          const inside = relative(base, filename);
          return inside !== ".." && !inside.startsWith(`..${sep}`) && !isAbsolute(inside);
        })) return;
        refreshComponentRoots();
        for (const id of [componentModuleId, sourceModuleId]) {
          const module = server.moduleGraph.getModuleById(id);
          if (module) server.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", refresh);
      server.watcher.on("unlink", refresh);
    },

    resolveId(id, importer) {
      const inlineId = inlineReact.resolve(id);
      if (inlineId) return inlineId;
      const authoredFile = inlineReact.importer(importer);
      if (authoredFile)
        return this.resolve(id, authoredFile, { skipSelf: true });
      if (id === codePreviewComponentVirtualModuleId) {
        return componentModuleId;
      }

      if (id === codePreviewSourceVirtualModuleId) {
        return sourceModuleId;
      }
    },

    load: {
      filter: {
        id: /^\0virtual:moyaforge-mdx\/(?:react-preview\/|code-preview-(?:components|sources)$)/,
      },
      async handler(id) {
        if (inlineReact.importer(id)) return inlineReact.load(id);
        if (id === componentModuleId) {
          const entries = Array.from(modules)
            .filter(([, path]) => componentFilePattern.test(path))
            .map(
              ([key, path]) =>
                `  ${JSON.stringify(key)}: () => import(${JSON.stringify(normalizePath(path))}),`,
            );

          const componentModule = `export default {\n${entries.join("\n")}\n};\n`;

          return componentModule;
        }

        if (id === sourceModuleId) {
          const entries = Array.from(modules, ([key, path]) => {
            const file = `${normalizePath(path)}?raw`;

            return (
              `  ${JSON.stringify(key)}: () => ` +
              `import(${JSON.stringify(file)}).then(m => m.default),`
            );
          });

          const sourceModule = `export default {\n${entries.join("\n")}\n};\n`;

          return sourceModule;
        }
      },
    },
  };
}
