import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  // The consuming Vite app owns the client’s HMR and asset URLs.
  define:
    command === "build" ? { "import.meta.hot": "import.meta.hot" } : undefined,
  ssr: { external: true },
  build: {
    ssr: true,
    target: "node22",
    minify: false,
    copyPublicDir: false,
    emptyOutDir: true,
    sourcemap: true,
    rolldownOptions: {
      input: [
        "src/index.ts",
        "vite-plugin/index.ts",
        "src/search/search-client.tsx",
      ],
      external: [
        "sql.js/dist/sql-wasm.wasm?url",
        "virtual:moyaforge-search/database",
      ],
      treeshake: false,
      output: {
        format: "es",
        entryFileNames: "[name].js",
        preserveModules: true,
        preserveModulesRoot: fileURLToPath(new URL("./", import.meta.url)),
      },
    },
  },
}));
