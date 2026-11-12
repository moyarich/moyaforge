import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import {
  createMdxOptions,
  createContentDiscovery,
  remarkSourceLinks,
} from "@moyarich/moyaforge-mdx";
import { mdxRegistryPlugin } from "@moyarich/moyaforge-mdx/vite";
import registry from "./registry.config.ts";
import { sqliteSearchPlugin } from "@moyarich/moyaforge-search-sqlite/vite";

const contentRoot = fileURLToPath(new URL(".", import.meta.url));
const discovery = createContentDiscovery(registry, contentRoot);
const { registry: discovered } = await discovery.get();

const compileMdx = mdx(
  createMdxOptions({
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
        fallbackLanguage: "text",
        // Shiki rebuilds <pre>; preserve compiler language metadata there.
        transformers: [
          {
            name: "moyaforge-code-language",
            pre(node) {
              node.properties["data-language"] = this.options.lang;
              const filename = /(?:^|\s)filename="([^"]+)"/.exec(
                this.options.meta?.__raw ?? "",
              )?.[1];
              if (filename) node.properties["data-filename"] = filename;
            },
          },
        ],
      },
    ],
  }),
);

export default defineConfig({
  plugins: [
    mdxRegistryPlugin({
      discovery,
      registry,
      root: fileURLToPath(new URL(".", import.meta.url)),
    }),
    sqliteSearchPlugin({
      discovery,
      registry,
      root: fileURLToPath(new URL(".", import.meta.url)),
    }),
    {
      ...compileMdx,
      enforce: "pre",
      transform(code, id) {
        if (id.split("?")[1]?.split("&").includes("raw")) return;
        return compileMdx.transform.call(this, code, id);
      },
    },
    react({ include: /\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
  worker: { format: "es" },
  base: process.env.VITE_BASE_PATH || process.env.PAGES_BASE_PATH || "/",
  build: { outDir: "dist", emptyOutDir: true },
});
