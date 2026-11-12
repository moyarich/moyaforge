import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  ssr: { external: true },
  build: {
    ssr: true,
    target: "node22",
    minify: false,
    copyPublicDir: false,
    emptyOutDir: true,
    rolldownOptions: {
      input: [
        "src/index.ts",
        "src/vite/plugin.ts",
        "src/content/source-files.ts",
        "src/navigation/toc.ts",
        "src/navigation/tree.ts",
      ],
      treeshake: false,
      output: {
        format: "es",
        entryFileNames: "[name].js",
        preserveModules: true,
        preserveModulesRoot: fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
