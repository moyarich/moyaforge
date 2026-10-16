import type { Plugin } from "vite";

export interface SearchRegistrySource {
  base: string;
  include: readonly string[];
  exclude?: readonly string[];
  pageFiles?: "canonical" | "all";
}
export interface SqliteSearchPluginOptions {
  root: string;
  registry: { sources: Record<string, SearchRegistrySource> };
}
/** Optional Vite adapter; the core indexing/query API remains framework-independent. */
export function sqliteSearchPlugin(options: SqliteSearchPluginOptions): Plugin;
