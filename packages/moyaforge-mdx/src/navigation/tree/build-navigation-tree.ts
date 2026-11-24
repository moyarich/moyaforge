import type { RegistryPage } from "../../registry/index.js";
import type { NavigationNode } from "./tree.types.js";

/**
 * Build a navigation hierarchy from the normalized page registry.
 * Only visible pages participate; missing ancestor paths become virtual nodes.
 * Siblings sort by explicit or inherited page order and then route path.
 *
 * @param pages - Normalized registry pages.
 * @returns Ordered root navigation nodes.
 */
export function buildNavigationTree(
  pages: readonly RegistryPage[],
): NavigationNode[] {
  const nodes = new Map<string, NavigationNode>();
  const roots: NavigationNode[] = [];
  for (const page of pages) {
    if (page.navigation !== "visible") continue;
    const segments = page.path.split("/").filter(Boolean);
    let parent: NavigationNode | undefined;
    for (let i = 0; i < segments.length; i++) {
      const path = "/" + segments.slice(0, i + 1).join("/");
      let node = nodes.get(path);
      if (!node) {
        node = { path, children: [] };
        nodes.set(path, node);
        if (parent) parent.children.push(node);
        else roots.push(node);
      }
      parent = node;
    }
    if (parent) parent.page = page;
  }
  /** Sort sibling nodes recursively by explicit or inherited page order. */
  function sort(nodes: NavigationNode[]): void {
    nodes.sort(
      (a, b) =>
        (a.page?.order ?? descendantOrder(a)) -
          (b.page?.order ?? descendantOrder(b)) || a.path.localeCompare(b.path),
    );
    for (const node of nodes) sort(node.children);
  }
  sort(roots);
  return roots;
}

/**
 * Find the lowest order of a virtual directory's descendant pages.
 *
 * @param node - Navigation node whose descendants provide its order.
 * @returns Lowest descendant order, or MAX_SAFE_INTEGER if empty.
 */
function descendantOrder(node: NavigationNode): number {
  return node.children.reduce(
    (min, child) => Math.min(min, child.page?.order ?? descendantOrder(child)),
    Number.MAX_SAFE_INTEGER,
  );
}
