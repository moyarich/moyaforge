import { readdirSync } from "node:fs";
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
  /** Registry key -> absolute file path */
  modules: ReadonlyMap<string, string>;

  /** Absolute file path -> registry key */
  keysByPath: ReadonlyMap<string, string>;

  /** Absolute file path -> source root */
  basesByPath: ReadonlyMap<string, string>;

  resolutionScope: NonNullable<CodePreviewOptions["resolutionScope"]>;
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

const sourceFilePattern = /^[\w-]+\.(?:tsx|jsx|ts|js|md|mdx)$/;
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

  console.log("---$$$$createCodePreview");
  console.log("registered modules:", modules.size);
  console.log("registered paths:", keysByPath.size);

  return {
    modules,
    keysByPath,
    basesByPath,
    resolutionScope,
  };
}

export function resolveCodePreviewSource({
  context: { keysByPath, basesByPath, resolutionScope },
  reference,
  authoredFile,
}: ResolveCodePreviewSourceOptions): string | undefined {
  if (!sourceFilePattern.test(basename(reference))) return;

  const authored = resolve(authoredFile);
  const candidate = resolve(dirname(authored), reference);
  const key = keysByPath.get(candidate);

  console.log("---$$$$resolveCodePreviewSource");
  console.log("reference:", reference);
  console.log("authoredFile:", authored);
  console.log("candidate:", candidate);
  console.log("resolved key:", key);

  if (!key) return;

  if (resolutionScope === "directory") {
    return dirname(candidate) === dirname(authored) ? key : undefined;
  }

  if (resolutionScope === "source") {
    const base = basesByPath.get(candidate);
    if (!base) return;

    const path = relative(base, authored);

    if (path === ".." || path.startsWith(`..${sep}`) || isAbsolute(path)) {
      return;
    }
  }

  return key;
}

export function createCodePreviewPlugin({
  modules,
}: CodePreviewContext): Plugin {
  return {
    name: codePreviewPluginName,

    resolveId(id) {
      if (id === codePreviewComponentVirtualModuleId) {
        return componentModuleId;
      }

      if (id === codePreviewSourceVirtualModuleId) {
        return sourceModuleId;
      }
    },

    load(id) {
      if (id === componentModuleId) {
        const entries = Array.from(modules)
          .filter(([, path]) => componentFilePattern.test(path))
          .map(
            ([key, path]) =>
              `  ${JSON.stringify(key)}: () => import(${JSON.stringify(normalizePath(path))}),`,
          );

        const componentModule = `export default {\n${entries.join("\n")}\n};\n`;

        console.log("---$$$$code-preview-components");
        console.log("registered components:", entries.length);
        console.log(componentModule);

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

        console.log("---$$$$code-preview-sources");
        console.log("registered sources:", entries.length);
        console.log(sourceModule);

        return sourceModule;
      }
    },
  };
}
