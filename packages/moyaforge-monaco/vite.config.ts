import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: true,
    target: "es2022",
    minify: false,
    copyPublicDir: false,
    rolldownOptions: {
      input: ["src/react.ts", "src/typefox.ts", "src/shared.ts", "src/vite.ts"],
      external: [
        /^(?:node:|@|monaco-editor(?:\/|$)|monaco-languageclient(?:\/|$)|virtual:)/,
      ],
      output: {
        format: "es",
        entryFileNames: "[name].js",
        preserveModules: true,
        preserveModulesRoot: fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
