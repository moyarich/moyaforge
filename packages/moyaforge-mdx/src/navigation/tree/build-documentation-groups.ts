import type { RegistryPage } from "../../registry/index.js";
import type {
  DocumentationGroup,
  DocumentationSourceNavigation,
} from "./tree.types.js";
import { buildNavigationTree } from "./build-navigation-tree.js";

/**
 * Group discovered routes into source-specific sidebar sections.
 * Groups sort by source navigation order, then source key. Each group uses
 * buildNavigationTree; virtual source roots are unwrapped, while real source
 * landing pages remain in the hierarchy.
 *
 * @param routes - Registered normalized pages from content discovery.
 * @param sources - Source navigation labels and ordering configuration.
 * @returns Ordered groups containing visible navigation nodes.
 */
export function buildDocumentationGroups(
  routes: readonly RegistryPage[],
  sources: Readonly<Record<string, DocumentationSourceNavigation>> = {},
): DocumentationGroup[] {
  const sourceNames = [...new Set(routes.map((page) => page.source))].sort(
    (a, b) =>
      (sources[a]?.navigation?.order ?? 0) -
        (sources[b]?.navigation?.order ?? 0) || a.localeCompare(b),
  );
  return sourceNames.map((source) => {
    const pages = routes.filter((page) => page.source === source);
    const landing = pages.find(
      (page) => page.path === `/${source}` && page.navigation === "visible",
    );
    const promoted = landing?.sidebar?.group ? landing : undefined;
    return {
      source,
      label: promoted
        ? promoted.title
        : (sources[source]?.navigation?.label ?? source),
      ...(promoted
        ? {
            page: promoted,
            collapsible: promoted.sidebar?.collapsible ?? false,
            defaultOpen: promoted.sidebar?.defaultOpen ?? true,
          }
        : {}),
      nodes: buildNavigationTree(pages).flatMap((node) =>
        node.path === `/${source}`
          ? promoted || !node.page
            ? node.children
            : [node]
          : [node],
      ),
    };
  });
}
