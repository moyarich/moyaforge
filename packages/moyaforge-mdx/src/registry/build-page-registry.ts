import {
  buildNavigationTree,
  flattenNavigation,
} from "../navigation/tree/index.js";
import { normalizePages } from "./normalize-pages.js";
import type {
  PageInput,
  PageRegistry,
  RegistryPage,
  TocSetting,
} from "./registry.types.js";

/**
 * Build route, navigation, breadcrumb, and adjacent-page views of a source manifest.
 * @param sources Documents grouped by their configured content-source key.
 * @param options Project defaults applied unless a page overrides them.
 * @returns A registry whose views reference the same validated page objects.
 * @throws {Error} For invalid metadata, invalid content paths, or duplicate routes.
 */
export function buildPageRegistry(
  sources: Record<string, readonly PageInput[]>,
  options: { toc?: TocSetting } = {},
): PageRegistry {
  const pages = normalizePages(sources, options);
  const routes = pages.filter((p) => p.navigation !== "disabled");
  const tree = buildNavigationTree(routes);
  const navigation = flattenNavigation(tree);
  const byPath = new Map(routes.map((p) => [p.path, p]));
  return {
    pages,
    routes,
    navigation,
    tree,
    byPath,
    breadcrumbs(path) {
      const page = byPath.get(path);
      if (!page) return [];
      const ancestors: RegistryPage[] = [];
      let parent = page.parentPath;
      while (parent) {
        const candidate = byPath.get(parent);
        if (candidate && candidate.navigation === "visible")
          ancestors.unshift(candidate);
        parent =
          candidate?.parentPath ??
          (parent.lastIndexOf("/") > 0
            ? parent.slice(0, parent.lastIndexOf("/"))
            : null);
      }
      return [...ancestors, page];
    },
    previousNext(path) {
      const index = navigation.findIndex((p) => p.path === path);
      return index < 0
        ? {}
        : { previous: navigation[index - 1], next: navigation[index + 1] };
    },
  };
}
