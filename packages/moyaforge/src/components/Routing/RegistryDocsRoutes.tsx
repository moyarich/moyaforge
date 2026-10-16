import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type { NormalizedPage } from "@moyarich/moyaforge-mdx";

export interface RegistryLazySources {
  readonly [source: string]: {
    readonly lazyPages?: Readonly<Record<string, () => Promise<{ default: ComponentType }>>>;
  };
}

export interface RegistryDocsRoutesProps {
  /** Canonical metadata exported from virtual:moyaforge-mdx/metadata. */
  routes: readonly NormalizedPage[];
  /** Lazy MDX modules exported from virtual:moyaforge-mdx/lazy-registry. */
  sources: RegistryLazySources;
  notFound?: ReactNode;
  fallback?: ReactNode;
  renderPage?: (page: NormalizedPage, content: ReactNode) => ReactNode;
}

const cache = new WeakMap<() => Promise<{ default: ComponentType }>, ComponentType>();

/**
 * Renders any discovered MDX page under the consumer's existing React Router.
 * Mount once at a host wildcard route; no per-page Route elements or router wrapper.
 */
export function RegistryDocsRoutes({
  routes,
  sources,
  notFound = <p>Page not found.</p>,
  fallback = <p role="status">Loading documentation…</p>,
  renderPage,
}: RegistryDocsRoutesProps) {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const page = routes.find((route) => route.path === path && route.navigation !== "disabled");
  const loader = page && sources[page.source]?.lazyPages?.[page.file];
  if (!page || !loader) return <>{notFound}</>;
  let Component = cache.get(loader);
  if (!Component) {
    Component = lazy(loader);
    cache.set(loader, Component);
  }
  const content = (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
  return <>{renderPage ? renderPage(page, content) : content}</>;
}
