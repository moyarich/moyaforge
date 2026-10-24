import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import {
  createMdxOptions,
  discoverContent,
  remarkSourceLinks,
} from "@moyarich/moyaforge-mdx";
import { mdxRegistryPlugin } from "@moyarich/moyaforge-mdx/vite";
import registry from "./registry.config.ts";
import { sqliteSearchPlugin } from "@moyarich/moyaforge-search-sqlite/vite";

const contentRoot = fileURLToPath(new URL(".", import.meta.url));
const { registry: discovered } = await discoverContent(registry, contentRoot);

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
          previewDirectives: true,
          remarkPlugins: [
            [
              remarkSourceLinks,
              {
                config: registry,
                root: contentRoot,
                routes: discovered.routes,
              },
            ],
          ],
          directiveComponents: {
            "*": {
              component: "CustomBlock",
              typeProp: "type",
              titleProp: "title",
            },
            "code-group": {
              component: "CodeGroup",
              childType: "tab",
              childComponent: "CodeTab",
            },
          },
          shiki: [
            rehypeShiki,
            {
              themes: { light: "github-light", dark: "github-dark" },
              fallbackLanguage: "text"
            },
          ],
        }),
      ),
    },
    react({ include: /\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
  worker: { format: "es" },
  base: process.env.VITE_BASE_PATH || process.env.PAGES_BASE_PATH || "/",
  build: { outDir: "dist", emptyOutDir: true },
});
