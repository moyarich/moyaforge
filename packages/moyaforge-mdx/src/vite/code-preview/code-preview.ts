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

/** A content registry source whose base path is relative to `CodePreviewOptions.root`. */
export interface CodePreviewSource {
  /** Directory containing the source's documentation pages. */
  base: string;
}

/** An authored documentation page discovered by the content registry. */
export interface CodePreviewPage {
  /** Key identifying the page's entry in `CodePreviewOptions.sources`. */
  source: string;
  /** Page filename relative to the corresponding source base. */
  file: string;
}

/** Configuration for discovering preview files adjacent to documentation pages. */
export interface CodePreviewOptions {
  /** Base directory used to resolve source bases and Vite component roots. */
  root: string;
  /** Source names and their base directories from the content registry. */
  sources: Readonly<Record<string, CodePreviewSource>>;
  /** Pages whose sibling files should be registered as preview sources. */
  pages: readonly CodePreviewPage[];
  /**
   * Limits resolution of automatically discovered files.
   * - `global`: allow references across registered documentation sources (default).
   * - `source`: restrict references to the authored page's source root.
   * - `directory`: restrict references to the authored page's directory.
   *
   * Explicit Vite component roots are trusted independently of this setting.
   * @default "global"
   */
  resolutionScope?: "global" | "source" | "directory";
  /**
   * Behavior when a page directory lies outside its configured source base.
   * @default "skip"
   */
  outOfRoot?: "allow" | "skip" | "throw";
}

/**
 * Shared preview registry created from docs and extended by the Vite plugin.
 *
 * Pass this context to both `createCodePreviewPlugin` and
 * `resolveCodePreviewSource`. The plugin adds explicitly registered
 * components to the same lookup maps used by documentation examples.
 */
export interface CodePreviewContext {
  /** Base directory for resolving documentation and additional component roots. */
  root: string;
  /**
   * Absolute, deduplicated directories containing discovered documentation pages.
   * Extend this array in `createCodePreviewPlugin({ componentRoots })` to also
   * register components from outside the documentation tree.
   */
  componentRoots: readonly string[];
  /** Registers and resolves inline React preview modules from MDX directives. */
  inlineReact: ReturnType<typeof createInlineReactModules>;
  /** Registry identifier to absolute source file path, including non-React sources. */
  modules: Map<string, string>;
  /** Absolute source file path to registry identifier (reverse lookup). */
  keysByPath: Map<string, string>;
  /** Absolute source file path to its registration base directory. */
  basesByPath: Map<string, string>;
  /** Resolution restriction applied to automatically discovered docs files. */
  resolutionScope: NonNullable<CodePreviewOptions["resolutionScope"]>;
  /**
   * Absolute path to registry identifier for files found in explicit Vite
   * component roots. The Vite plugin updates this map when files change.
   */
  registeredComponents: Map<string, string>;
}

/** Configuration for loading the preview registry through Vite. */
export interface CodePreviewPluginOptions {
  /** Shared context returned by `createCodePreview()`. */
  codePreview: CodePreviewContext;
  /**
   * Directories to register for file-backed React previews.
   * Include `...codePreview.componentRoots` to retain the discovered docs
   * directories and append any extra roots; these are searched recursively
   * for `.tsx` and `.jsx` files.
   *
   * Paths can be absolute or relative to `codePreview.root`. Directories
   * already registered as documentation page directories are not rescanned.
   * If omitted, defaults to `codePreview.componentRoots`.
   *
   * @default codePreview.componentRoots
   */
  componentRoots?: readonly string[];
}

/** Arguments for resolving an MDX component reference against the preview registry. */
export interface ResolveCodePreviewSourceOptions {
  /** Shared registry populated by `createCodePreviewPlugin()`. */
  context: CodePreviewContext;
  /** Relative file reference, optionally suffixed by `#NamedExport`. */
  reference: string;
  /** Absolute or resolvable path of the Markdown or MDX page using the component. */
  authoredFile: string;
}

/** Virtual Vite module exporting lazy loaders for registered preview components. */
export const codePreviewComponentVirtualModuleId =
  "virtual:moyaforge-mdx/code-preview-components";

/** Virtual Vite module exporting lazy raw-source loaders for registered files. */
export const codePreviewSourceVirtualModuleId =
  "virtual:moyaforge-mdx/code-preview-sources";

/** Name used to identify the Vite code-preview integration plugin. */
export const codePreviewPluginName = "moyaforge-mdx:code-preview";

const componentModuleId = `\0${codePreviewComponentVirtualModuleId}`;
const sourceModuleId = `\0${codePreviewSourceVirtualModuleId}`;

const sourceFilePattern = /^[\w-]+(?:\.[\w-]+)*\.(?:tsx|jsx|ts|js|md|mdx|css)$/;
const componentFilePattern = /\.(?:tsx|jsx)$/;

/**
 * Build the preview context from discovered documentation pages.
 *
 * Registers eligible sibling files and returns the unique page directories
 * in `componentRoots`. The context's lookup maps are extended by
 * `createCodePreviewPlugin()` when you specify additional component roots.
 *
 * @example
 * ```ts
 * const codePreview = createCodePreview({
 *   root: contentRoot,
 *   sources: registry.sources,
 *   pages: discovered.pages,
 * });
 * ```
 *
 * @returns Shared registry for MDX resolution and the Vite preview plugin.
 */
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
  const componentRoots = new Set<string>();
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

    componentRoots.add(directory);
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
    componentRoots: [...componentRoots],
    inlineReact: createInlineReactModules(),
    modules,
    keysByPath,
    basesByPath,
    resolutionScope,
    registeredComponents,
  };
}

/**
 * Resolve a relative MDX preview component path to a registered module key.
 *
 * Supports `#ExportName` for named exports and returns `undefined` when
 * the file is not registered or the reference is outside its allowed scope.
 *
 * @example
 * ```ts
 * resolveCodePreviewSource({
 *   context: codePreview,
 *   reference: "./Example.tsx",
 *   authoredFile: "/app/docs/guide/page.mdx",
 * });
 * ```
 *
 * @returns Registry key (optionally with a named export suffix), or `undefined`.
 */
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

/**
 * Create a Vite plugin that loads and watches registered code-preview files.
 *
 * Extends the `codePreview` registry with components found recursively in
 * additional `componentRoots`, keeping the existing sibling registrations.
 * The plugin updates `modules`, `keysByPath`, and `basesByPath` and
 * invalidates its virtual modules when registered components are added or removed.
 *
 * @example
 * ```ts
 * createCodePreviewPlugin({
 *   codePreview,
 *   componentRoots: [
 *     ...codePreview.componentRoots,
 *     "../../packages/moyaforge-ui/src/components",
 *   ],
 * });
 * ```
 *
 * @returns A Vite plugin exposing lazy component and raw-source virtual modules.
 */
export function createCodePreviewPlugin({
  codePreview,
  componentRoots = codePreview.componentRoots,
}: CodePreviewPluginOptions): Plugin {
  const {
    root,
    modules,
    inlineReact,
    keysByPath,
    basesByPath,
    registeredComponents,
  } = codePreview;
  const pageDirectories = new Set(codePreview.componentRoots);
  const directories = [...new Set(componentRoots.map((directory) => {
    const absolute = resolve(root, directory);
    if (!existsSync(absolute) || !statSync(absolute).isDirectory())
      throw new Error(`Invalid code-preview component root: ${directory}. Expected an existing directory.`);
    return absolute;
  }))].filter((directory) => !pageDirectories.has(directory));
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
