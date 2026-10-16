import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import { createMdxOptions } from "@moyarich/moyaforge-mdx";
import { mdxRegistryPlugin } from "@moyarich/moyaforge-mdx/vite";
import registry from "./registry.config.ts";
import { sqliteSearchPlugin } from "@moyarich/moyaforge-search-sqlite/vite";

export default defineConfig({
  plugins: [
    mdxRegistryPlugin({
      registry,
      root: fileURLToPath(new URL(".", import.meta.url)),
    }),
    sqliteSearchPlugin({
      registry,
      root: fileURLToPath(new URL(".", import.meta.url)),
    }),
    {
      enforce: "pre",
      ...mdx(
        createMdxOptions({
          shiki: [
            rehypeShiki,
            {
              themes: { light: "github-light", dark: "github-dark" },
              fallbackLanguage: "text",
              transformers: [
                {
                  name: "moyaforge-code-language",
                  pre(node) {
                    node.properties["data-language"] = this.options.lang;
                  },
                },
              ],
            },
          ],
        }),
      ),
    },
    react({ include: /\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
  worker: { format: "es" },
  base: process.env.VITE_BASE_PATH || "/",
  build: { outDir: "dist", emptyOutDir: true },
});
