import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import { createMdxOptions } from "@moyarich/moyaforge-mdx";
import { mdxRegistryPlugin } from "@moyarich/moyaforge-mdx/vite";
import registry from "./registry.config";
import { sqliteSearchPlugin } from "@moyarich/moyaforge-search-sqlite/vite";
export default defineConfig({
  root: import.meta.dirname,
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [
    mdxRegistryPlugin({ registry, root: import.meta.dirname }),
    sqliteSearchPlugin({ registry, root: import.meta.dirname }),
    {enforce: "pre", ...mdx(createMdxOptions({shiki:[rehypeShiki,{themes:{light:"github-light",dark:"github-dark"}, fallbackLanguage:"text"}]}))},
    react({include:/\.(?:js|jsx|md|mdx|ts|tsx)$/})
  ],
});
