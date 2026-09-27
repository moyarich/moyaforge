export const DEFAULT_MOYAFORGE_PATHS = Object.freeze({
  playground: "apps/playground",
  source: "apps/playground/src",
  docs: "docs",
  api: "api",
  output: "apps/playground/dist",
});

export function defineMoyaForgeConfig(config = {}) {
  return {
    ...config,
    paths: {
      ...DEFAULT_MOYAFORGE_PATHS,
      ...(config.paths ?? {}),
    },
  };
}

export {
  compareOrderedPaths,
  createPageDescriptor,
  createPages,
  filterPages,
  labelFromSegment,
  pagePathParts,
  stripOrderPrefix,
} from "./content.js";
export { buildNavigation } from "./navigation.js";
export {
  CopyButton,
  Demo,
  NavigationTree,
  Page,
  Source,
  TableOfContents,
} from "./components.js";
export { createMdxComponents, moyaForgeComponents } from "./mdx.js";
