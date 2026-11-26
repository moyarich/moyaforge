import type { RegistryPage } from "../../registry/index.js";
import type { NavigationNode } from "./tree.types.js";

/**
 * Collect registered pages from a navigation tree in depth-first order.
 * Virtual directories without pages are omitted.
 *
 * @param tree - Root navigation nodes.
 * @returns Pages in navigation display order.
 */
export function flattenNavigation(
  tree: readonly NavigationNode[],
): RegistryPage[] {
  const pages: RegistryPage[] = [];
  /** Visit real pages recursively without including virtual directories. */
  const visit = (nodes: readonly NavigationNode[]) => {
    for (const node of nodes) {
      if (node.page) pages.push(node.page);
      visit(node.children);
    }
  };
  visit(tree);
  return pages;
}
