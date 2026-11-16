import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin } from "vite";

const moduleId = "virtual:moyaforge-monaco/react-types";
const declarations = {
  "@types/react": ["index", "global", "jsx-runtime", "jsx-dev-runtime"],
  "@types/react-dom": ["index", "client"],
  csstype: ["index"],
};

export function monacoReactTypesPlugin(root: string): Plugin {
  const resolvePackage = createRequire(
    pathToFileURL(join(root, "package.json")),
  );
  return {
    name: "monaco-react-types",
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
            this.addWatchFile(installedFile);
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
