import type { DocumentationSitePage } from "./DocumentationSite.types.js";

/** Resolve visible navigation and breadcrumbs from the same registry page objects. */
export function getDocumentationNavigation(
  pages: readonly DocumentationSitePage[],
  currentPath?: string,
) {
  const visiblePages = pages.filter(
    (page) => !page.navigation || page.navigation === "visible",
  );
  const byPath = new Map(
    pages
      .filter((page) => page.navigation !== "disabled")
      .map((page) => [page.path, page]),
  );
  const current = currentPath ? byPath.get(currentPath) : undefined;
  const currentIndex = visiblePages.findIndex(
    (page) => page.path === currentPath,
  );
  const breadcrumbs: DocumentationSitePage[] = [];
  if (current) {
    breadcrumbs.push(current);
    let parentPath =
      current.parentPath === undefined
        ? parentRoute(current.path)
        : current.parentPath;
    const visited = new Set([current.path]);
    while (parentPath && !visited.has(parentPath)) {
      visited.add(parentPath);
      const parent = byPath.get(parentPath);
      if (parent && (!parent.navigation || parent.navigation === "visible"))
        breadcrumbs.unshift(parent);
      parentPath =
        parent?.parentPath === undefined
          ? parentRoute(parentPath)
          : parent.parentPath;
    }
  }
  return {
    visiblePages,
    current,
    previous: currentIndex > 0 ? visiblePages[currentIndex - 1] : undefined,
    next: currentIndex >= 0 ? visiblePages[currentIndex + 1] : undefined,
    breadcrumbs,
  };
}

/** Locate the containing route when a standalone page omits registry parent metadata. */
function parentRoute(path: string): string | null {
  const separator = path.lastIndexOf("/");
  return separator > 0 ? path.slice(0, separator) : null;
}

/** Build an encoded edit link using the configured branch and repository source path. */
export function getRepositoryEditUrl(
  repository?: string,
  branch = "main",
  sourcePath?: string,
): string | undefined {
  if (!repository || !sourcePath) return repository;
  return `${repository.replace(/\/$/, "")}/edit/${encodeURIComponent(branch)}/${sourcePath.split("/").map(encodeURIComponent).join("/")}`;
}
