export const DEFAULT_MOYAFORGE_PATHS = Object.freeze({
  playground: "packages/playground",
  source: "packages/playground/src",
  docs: "docs",
  api: "api",
  output: "packages/playground/dist",
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
  compileMdx,
  createMdxComponentRegistry,
  resolveMdxComponents,
} from "./mdx.js";
