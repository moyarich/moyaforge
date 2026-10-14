import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { createMdxOptions } from "@moyarich/moyaforge-mdx";

export default defineConfig({
  plugins: [
    { enforce: "pre", ...mdx(createMdxOptions()) },
    react({ include: /\\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
  worker: { format: "es" },
  base: process.env.VITE_BASE_PATH || "/",
  build: { outDir: "dist", emptyOutDir: true },
});
