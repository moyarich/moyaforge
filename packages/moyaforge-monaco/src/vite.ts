import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin } from "vite";

/** Vite virtual module that provides React declaration files to Monaco. */
const moduleId = "virtual:moyaforge-monaco/react-types";

/**
 * Type declaration entry points to expose through the virtual module.
 *
 * Keys are package names resolved relative to the consuming project's root.
 * Values are declaration filenames without the `.d.ts` extension.
 */
const declarations = {
  "@types/react": ["index", "global", "jsx-runtime", "jsx-dev-runtime"],
  "@types/react-dom": ["index", "client"],
  csstype: ["index"],
};

/**
 * Creates a Vite plugin that makes installed React TypeScript declarations
 * available to Monaco through `virtual:moyaforge-monaco/react-types`.
 *
 * The virtual module exports a mapping from `file:///node_modules/...`
 * declaration paths to their UTF-8 source text. Packages are resolved from
 * the consuming project's `package.json`, so the declarations match the
 * project's installed dependencies.
 *
 * During development, the plugin watches those declaration files and triggers
 * a full page reload when any of them are added, changed, or removed.
 *
 * @param root - Absolute path to the consuming project's root directory,
 *   containing its `package.json`.
 * @returns A Vite plugin that resolves, loads, and watches the React types
 *   virtual module.
 */
export function monacoReactTypesPlugin(root: string): Plugin {
  const resolvePackage = createRequire(
    pathToFileURL(join(root, "package.json")),
  );
  const watchedFiles = new Set<string>();
  let devServer: import("vite").ViteDevServer | undefined;

  /** Reloads the dev page when a tracked declaration file changes. */
  const reload = (file: string) => {
    if (!watchedFiles.has(resolve(file)) || !devServer) return;

    const module = devServer.moduleGraph.getModuleById("\0" + moduleId);
    if (module) devServer.moduleGraph.invalidateModule(module);
    devServer.ws.send({ type: "full-reload" });
  };

  return {
    name: "moyaforge-monaco:react-types",
    configureServer(server) {
      devServer = server;
      for (const event of ["add", "change", "unlink"] as const) {
        server.watcher.on(event, reload);
      }
    },
    resolveId(id) {
      if (id === moduleId) return "\0" + moduleId;
    },
    async load(id) {
      if (id !== "\0" + moduleId) return;
      const libraries = await Promise.all(
        Object.entries(declarations).flatMap(([packageName, declarations]) => {
          const directory = dirname(
            resolvePackage.resolve(`${packageName}/package.json`),
          );
          return declarations.map(async (declaration) => {
            const filename = `${declaration}.d.ts`;
            const installedFile = join(directory, filename);
            watchedFiles.add(resolve(installedFile));
            this.addWatchFile(installedFile);
            devServer?.watcher.add(installedFile);
            return [
              `file:///node_modules/${packageName}/${filename}`,
              await readFile(installedFile, "utf8"),
            ];
          });
        }),
      );
      return `export default ${JSON.stringify(Object.fromEntries(libraries))};`;
    },
  };
}
