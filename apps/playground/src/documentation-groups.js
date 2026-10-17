import { buildNavigationTree } from "@moyarich/moyaforge-mdx/navigation";

/** Compose documentation navigation from the host application's source metadata. */
export function buildDocumentationGroups(routes, sources = {}) {
  const sourceNames = [...new Set(routes.map((item) => item.source))].sort(
    (a, b) =>
      (sources[a]?.navigation?.order ?? 0) -
        (sources[b]?.navigation?.order ?? 0) || a.localeCompare(b),
  );
  return sourceNames.map((source) => ({
    source,
    label: sources[source]?.navigation?.label ?? source,
    nodes: buildNavigationTree(
      routes.filter((item) => item.source === source),
    ).flatMap((node) =>
      node.path === `/${source}`
        ? node.page
          ? [node]
          : node.children
        : [node],
    ),
  }));
}
