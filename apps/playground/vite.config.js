import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { createMdxOptions } from "@moyarich/moyaforge-mdx";
import { mdxRegistryPlugin } from "@moyarich/moyaforge-mdx/vite";
import registry from "./registry.config";

export default defineConfig({
  plugins: [
    mdxRegistryPlugin({
      registry,
      root: fileURLToPath(new URL(".", import.meta.url)),
    }),
    { enforce: "pre", ...mdx(createMdxOptions()) },
    react({ include: /\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
  worker: { format: "es" },
  base: process.env.VITE_BASE_PATH || "/",
  build: { outDir: "dist", emptyOutDir: true },
});
