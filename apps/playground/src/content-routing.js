import { pages, routes } from "virtual:moyaforge-mdx/metadata";

/** Query routing works on GitHub Pages without requiring SPA rewrite rules. */
export const routeParam = "page";
export function readContentRoute(search = window.location.search) {
  const path = new URLSearchParams(search).get(routeParam);
  return path ? normalizeRoute(path) : null;
}
export function normalizeRoute(path) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  const normalized = path.replace(/\/+$/, "") || "/";
  return routes.some((page) => page.path === normalized) ? normalized : null;
}
export function contentHref(path, hash = "") {
  const url = new URL(window.location.href);
  url.searchParams.set(routeParam, path);
  url.hash = hash ? `#${encodeURIComponent(hash)}` : "";
  return url.pathname + url.search + url.hash;
}
export function firstContentRoute() {
  return (
    routes.find((page) => page.navigation === "visible")?.path ??
    pages[0]?.path ??
    null
  );
}
export function navigateContent(path) {
  const href = contentHref(path);
  window.history.pushState({ contentPath: path }, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
