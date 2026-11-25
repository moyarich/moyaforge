import { globSync } from "node:fs";
import { isAbsolute, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import type {} from "vite/types/metadata.d.ts";

const root = fileURLToPath(new URL(".", import.meta.url));
const componentEntries = Object.fromEntries(
  globSync("src/components/**/index.ts", { cwd: root })
    .sort()
    .map((file) => [
      file.replaceAll("\\", "/").slice("src/".length, -".ts".length),
      resolve(root, file),
    ]),
);
const entry = {
  "workers/configureReactWorkers": resolve(root, "src/workers/configureReactWorkers.ts"),
  "workers/configureTypeFoxWorkers": resolve(root, "src/workers/configureTypeFoxWorkers.ts"),
  "workers/createMonacoVscodeWorkerConfig": resolve(root, "src/workers/createMonacoVscodeWorkerConfig.ts"),
  "runtime/initializeMonacoVscodeRuntime": resolve(root, "src/runtime/initializeMonacoVscodeRuntime.ts"),
  "vite/monacoReactTypesPlugin": resolve(root, "src/vite/monacoReactTypesPlugin.ts"),
  ...componentEntries,
};

/** Export per-component CSS without bundling the React components together. */
function componentStyles(): Plugin {
  return {
    name: "moyaforge-monaco:component-styles",
    apply: "build",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const allStyles = new Set<string>();
        const emitStylesheet = (
          fileName: string,
          styles: ReadonlySet<string>,
        ) => {
          const imports = [...styles].map((style) => {
            const path = posix.relative(posix.dirname(fileName), style);
            return `@import ${JSON.stringify(path.startsWith(".") ? path : `./${path}`)};`;
          });
          this.emitFile({
            type: "asset",
            fileName,
            source: imports.length ? `${imports.join("\n")}\n` : "",
          });
        };

        for (const name of Object.keys(componentEntries)) {
          const styles = new Set<string>();
          const visited = new Set<string>();
          const visit = (fileName: string) => {
            const chunk = bundle[fileName];
            if (!chunk || chunk.type !== "chunk" || visited.has(fileName))
              return;
            visited.add(fileName);
            for (const dependency of chunk.imports) visit(dependency);
            for (const style of chunk.viteMetadata?.importedCss ?? []) {
              styles.add(style);
              allStyles.add(style);
            }
          };

          visit(`${name}.js`);
          emitStylesheet(`${posix.dirname(name)}/styles.css`, styles);
        }
        emitStylesheet("styles.css", allStyles);
      },
    },
  };
}

export default defineConfig({
  plugins: [componentStyles()],
  build: {
    target: "es2022",
    minify: false,
    copyPublicDir: false,
    cssCodeSplit: true,
    lib: {
      entry,
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rolldownOptions: {
      external(id) {
        return !id.startsWith(".") && !id.startsWith("\0") && !isAbsolute(id);
      },
      output: {
        format: "es",
        entryFileNames: "[name].js",
        preserveModules: true,
        preserveModulesRoot: resolve(root, "src"),
      },
    },
  },
});
