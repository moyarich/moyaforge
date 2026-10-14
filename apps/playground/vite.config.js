import { defineConfig } from "vite";
import { registryPlugin } from "./vite-registry-plugin/index.js";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { createMoyaForgeMdxOptions } from "@moyarich/moyaforge/mdx";

export default defineConfig({
  plugins: [
    registryPlugin(),
    { enforce: "pre", ...mdx(createMoyaForgeMdxOptions()) },
    react({ include: /\\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
  worker: { format: "es" },
  base: process.env.VITE_BASE_PATH || "/",
  build: { outDir: "dist", emptyOutDir: true },
});
