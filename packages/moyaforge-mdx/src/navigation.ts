import type { NormalizedPage } from "./registry.js";

/** Navigation nodes can represent a directory even when it has no landing page. */
export interface NavigationNode {
  path: string;
  page?: NormalizedPage;
  children: NavigationNode[];
}

/** Build a hierarchy from normalized paths, without a second authored nav manifest. */
export function buildNavigationTree(pages: readonly NormalizedPage[]): NavigationNode[] {
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
  function sort(nodes: NavigationNode[]): void {
    nodes.sort((a, b) =>
      (a.page?.order ?? descendantOrder(a)) - (b.page?.order ?? descendantOrder(b)) ||
      a.path.localeCompare(b.path),
    );
    for (const node of nodes) sort(node.children);
  }
  sort(roots);
  return roots;
}

/** A group without a landing page inherits its earliest child's order. */
function descendantOrder(node: NavigationNode): number {
  return node.children.reduce((min, child) => Math.min(min, child.page?.order ?? descendantOrder(child)), Number.MAX_SAFE_INTEGER);
}

export function flattenNavigation(tree: readonly NavigationNode[]): NormalizedPage[] {
  const pages: NormalizedPage[] = [];
  const visit = (nodes: readonly NavigationNode[]) => {
    for (const node of nodes) {
      if (node.page) pages.push(node.page);
      visit(node.children);
    }
  };
  visit(tree);
  return pages;
}
