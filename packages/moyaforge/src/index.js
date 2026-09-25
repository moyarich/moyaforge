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

export { moyaForgeComponents } from "./components.js";
