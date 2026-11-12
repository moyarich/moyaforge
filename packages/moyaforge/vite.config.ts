import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  ssr: { external: true },
  build: {
    ssr: true,
    target: "es2022",
    minify: false,
    copyPublicDir: false,
    emptyOutDir: true,
    rolldownOptions: {
      input: ["src/index.ts", "src/headless.ts", "src/registry-routes.tsx"],
      external: [/^virtual:moyaforge-mdx\//],
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
