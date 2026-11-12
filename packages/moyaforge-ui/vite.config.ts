import { globSync } from "node:fs";
import { isAbsolute, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import type {} from "vite/types/metadata.d.ts";

const root = fileURLToPath(new URL(".", import.meta.url));
const entry = Object.fromEntries(
  globSync("src/components/**/index.ts", { cwd: root })
    .sort()
    .map((file) => [
      file.replaceAll("\\", "/").slice("src/".length, -".ts".length),
      resolve(root, file),
    ]),
);

/** Publish stylesheet entry points without adding CSS imports to the ESM files. */
function componentStyles(): Plugin {
  return {
    name: "moyaforge-ui:component-styles",
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

        for (const name of Object.keys(entry)) {
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
        preserveModules: true,
        preserveModulesRoot: resolve(root, "src"),
      },
    },
  },
});
