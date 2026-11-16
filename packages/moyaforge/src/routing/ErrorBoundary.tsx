import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type { NormalizedPage } from "@moyarich/moyaforge-mdx";

import { DocumentationRoutesContext } from "./DocumentationLink.js";
import { useDocumentationHash } from "./useDocumentationHash.js";
import { ErrorBoundary } from "./PageLoadBoundary.js";

function RegistryPage({ component: Page }: { component: ComponentType }) {
  useDocumentationHash();
  return <Page />;
}

export interface RegistryLazySources {
  readonly [source: string]: {
    readonly lazyPages?: Readonly<
      Record<string, () => Promise<{ default: ComponentType }>>
    >;
  };
}

export interface RegistryRouteViewProps {
  /** Canonical metadata exported from virtual:moyaforge-mdx/metadata. */
  routes: readonly NormalizedPage[];
  /** Lazy MDX modules exported from virtual:moyaforge-mdx/lazy-registry. */
  sources: RegistryLazySources;
  notFound?: ReactNode;
  fallback?: ReactNode;
  renderPage?: (page: NormalizedPage, content: ReactNode) => ReactNode;
}

const cache = new WeakMap<
  () => Promise<{ default: ComponentType }>,
  ComponentType
>();

/**
 * Renders any discovered MDX page under the consumer's existing React Router.
 * Mount once at a host wildcard route; no per-page Route elements or router wrapper.
 */
export function RegistryRouteView({
  routes,
  sources,
  notFound = <p>Page not found.</p>,
  fallback = <p role="status">Loading documentation…</p>,
  renderPage,
}: RegistryRouteViewProps) {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  // Consumer route metadata may retain a trailing slash; match either form.
  const normalizeRoute = (value: string) => value.replace(/\/+$/, "") || "/";
  const page = routes.find(
    (route) =>
      normalizeRoute(route.path) === path && route.navigation !== "disabled",
  );
  const loader = page && sources[page.source]?.lazyPages?.[page.file];
  if (!page || !loader) return <>{notFound}</>;
  let Component = cache.get(loader);
  if (!Component) {
    Component = lazy(loader);
    cache.set(loader, Component);
  }
  const content = (
    <ErrorBoundary
      errorContext={`Failed to load documentation: ${path}`}
      message="Reload the documentation to try again."
      reloadButtonContent="Reload documentation"
    >
      <RegistryPage component={Component} />
    </ErrorBoundary>
  );
  // Keep this boundary stable across routes so transitions retain the current
  // article and its shell until the destination module is ready.
  return (
    <Suspense fallback={fallback}>
      <DocumentationRoutesContext.Provider value={routes}>
        {renderPage ? renderPage(page, content) : content}
      </DocumentationRoutesContext.Provider>
    </Suspense>
  );
}
