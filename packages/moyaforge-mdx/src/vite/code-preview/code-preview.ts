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
  resolutionScope?: "global" | "source" | "directory";
  outOfRoot?: "allow" | "skip" | "throw";
}

export interface CodePreviewContext {
  /** Base directory for resolving documentation and plugin component roots. */
  root: string;
  inlineReact: ReturnType<typeof createInlineReactModules>;
  /** Registry key -> absolute file path */
  modules: Map<string, string>;

  /** Absolute file path -> registry key */
  keysByPath: Map<string, string>;

  /** Absolute file path -> source root */
  basesByPath: Map<string, string>;

  resolutionScope: NonNullable<CodePreviewOptions["resolutionScope"]>;
  /** Absolute paths of components explicitly registered by the Vite plugin. */
  registeredComponents: Map<string, string>;
}

/** Vite-only component registration, separate from documentation discovery. */
export interface CodePreviewPluginOptions {
  codePreview: CodePreviewContext;
  /** Absolute directories or paths relative to codePreview.root, searched recursively. */
  componentRoots?: readonly string[];
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

  return {
    root,
    inlineReact: createInlineReactModules(),
    modules,
    keysByPath,
    basesByPath,
    resolutionScope,
    registeredComponents,
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
  codePreview: {
    root,
    modules,
    inlineReact,
    keysByPath,
    basesByPath,
    registeredComponents,
  },
  componentRoots = [],
}: CodePreviewPluginOptions): Plugin {
  const directories = componentRoots.map((directory) => {
    const absolute = resolve(root, directory);
    if (!existsSync(absolute) || !statSync(absolute).isDirectory())
      throw new Error(`Invalid code-preview component root: ${directory}. Expected an existing directory.`);
    return absolute;
  });
  // Track only entries added by this plugin; automatic page entries are owned by
  // createCodePreview and must survive a component root refresh.
  const ownedComponents = new Map<string, string>();

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
      const existingKey = keysByPath.get(path);
      if (existingKey) {
        registeredComponents.set(path, existingKey);
        continue;
      }
      const key = `component-root-${index}/${normalizePath(relative(base, path))}`;
      modules.set(key, path);
      keysByPath.set(path, key);
      basesByPath.set(path, base);
      ownedComponents.set(path, key);
      registeredComponents.set(path, key);
    }
  }

  function refreshComponentRoots() {
    for (const [path, key] of ownedComponents) {
      modules.delete(key);
      keysByPath.delete(path);
      basesByPath.delete(path);
    }
    ownedComponents.clear();
    registeredComponents.clear();
    directories.forEach((directory, index) => {
      if (existsSync(directory))
        registerComponentDirectory(directory, directory, index);
    });
  }

  refreshComponentRoots();

  return {
    name: codePreviewPluginName,

    configureServer(server) {
      if (!directories.length) return;
      server.watcher.add(directories);
      const refresh = (path: string) => {
        const filename = resolve(path);
        if (!componentFilePattern.test(filename)) return;
        if (!directories.some((base) => {
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
