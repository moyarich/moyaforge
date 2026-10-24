import type { Plugin } from "vite";
import type { createContentDiscovery } from "@moyarich/moyaforge-mdx";

export interface SearchRegistrySource {
  base: string;
  include: readonly string[];
  exclude?: readonly string[];
  pageFiles?: "canonical" | "all";
}
export interface SqliteSearchPluginOptions {
  root: string;
  discovery?: ReturnType<typeof createContentDiscovery>;
  registry: { sources: Record<string, SearchRegistrySource> };
}
/** Optional Vite adapter; the core indexing/query API remains framework-independent. */
export function sqliteSearchPlugin(options: SqliteSearchPluginOptions): Plugin;
