import type { NormalizedPage } from "@moyarich/moyaforge-mdx";

export function createContentRouting(pages: readonly NormalizedPage[]) {
  const routes = pages.filter((page) => page.navigation !== "disabled");
  const pagesByKey = new Map<string, NormalizedPage>();
  for (const page of routes) {
    const key = `${page.source}/${page.file}`;
    if (!pagesByKey.has(key)) pagesByKey.set(key, page);
  }
  return {
    routes,
    normalizeRoute(path: string) {
      if (!path.startsWith("/") || path.startsWith("//")) return null;
      const normalized = path.replace(/\/+$/, "") || "/";
      return routes.find((page) => page.path === normalized)?.path ?? null;
    },
    firstContentRoute() {
      return (
        routes.find((page) => page.navigation === "visible")?.path ??
        routes[0]?.path ??
        null
      );
    },
    searchResultPage(key: string) {
      return pagesByKey.get(key) ?? null;
    },
    searchResultPages(keys: readonly string[]) {
      return keys.flatMap((key) => {
        const page = pagesByKey.get(key);
        return page ? [page] : [];
      });
    },
    searchResultRoute(key: string) {
      return this.searchResultPage(key)?.path ?? null;
    },
  };
}
