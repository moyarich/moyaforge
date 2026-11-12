import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { routes } from "virtual:moyaforge-mdx/metadata";
import { sources } from "virtual:moyaforge-mdx/lazy-registry";

export const documentationLinkComponents = {};

const pagesByKey = new Map(
  routes.map((page) => [`${page.source}/${page.file}`, page]),
);

export function resolveSearchPages(keys: readonly string[]) {
  return keys.flatMap((key) => {
    const page = pagesByKey.get(key);
    return page ? [page] : [];
  });
}

const loaded = new Map<string, LazyExoticComponent<ComponentType>>();
export function ContentPage() {
  const { pathname } = useLocation();
  const currentPath = pathname.replace(/\/+$/, "") || "/";
  const page = routes.find((entry) => entry.path === currentPath);
  if (!page)
    return (
      <>
        <h1>Page not found</h1>
        <Link to="/docs">Documentation</Link>
      </>
    );
  const loader = sources[page.source]?.lazyPages?.[page.file];
  if (!loader) return <p>Content is unavailable.</p>;
  if (!loaded.has(page.path)) loaded.set(page.path, lazy(loader));
  const Page = loaded.get(page.path)!;
  return (
    <Suspense fallback={<p role="status">Loading page…</p>}>
      <Page />
    </Suspense>
  );
}
