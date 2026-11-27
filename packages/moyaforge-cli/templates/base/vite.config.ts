import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import { createMdxOptions } from "@moyarich/moyaforge-mdx";
import { mdxRegistryPlugin } from "@moyarich/moyaforge-mdx/vite";
__SEARCH_PLUGIN_IMPORT__
import registry from "./registry.config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("__SOURCE_ALIAS__/", import.meta.url)),
    },
  },
  root: import.meta.dirname,
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [
    mdxRegistryPlugin({ registry, root: import.meta.dirname }),
    __SEARCH_PLUGIN__
    {
      ...mdx(
        createMdxOptions({
          componentMappings: {
            card: { component: "Card", titleProp: "title" },
            "code-group": {
              component: "CodeGroup",
              childType: "tab",
              childComponent: "CodeTab",
            },
          },
          highlightingPlugin: [
            rehypeShiki,
            {
              themes: { light: "github-light", dark: "github-dark" },
              fallbackLanguage: "text",
            },
          ],
        }),
      ),
      enforce: "pre",
    },
    react({ include: /\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
});
