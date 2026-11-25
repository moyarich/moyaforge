import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin } from "vite";

/** Virtual module identifier used by both worker integrations. */
const moduleId = "virtual:moyaforge-monaco/react-types";
/** Declaration packages and entry filenames without the .d.ts suffix. */
const declarations = {
  "@types/react": ["index", "global", "jsx-runtime", "jsx-dev-runtime"],
  "@types/react-dom": ["index", "client"],
  csstype: ["index"],
};

/**
 * Expose the host project's React, React DOM and CSS declarations to Monaco.
 * The Vite virtual module maps file URIs to declaration source text. Changes
 * to watched declarations invalidate the module and reload the development page.
 * @param root - Directory containing the host package.json, used for dependency resolution.
 * @returns A Vite plugin that resolves, loads and watches the declarations.
 * @example plugins: [monacoReactTypesPlugin(import.meta.dirname)]
 */
export function monacoReactTypesPlugin(root: string): Plugin {
  const resolvePackage = createRequire(
    pathToFileURL(join(root, "package.json")),
  );
  const watchedFiles = new Set<string>();
  let devServer: import("vite").ViteDevServer | undefined;

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
