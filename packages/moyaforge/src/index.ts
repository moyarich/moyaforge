export const DEFAULT_MOYAFORGE_PATHS = Object.freeze({
  playground: "apps/playground",
  source: "apps/playground/src",
  docs: "docs",
  api: "api",
  output: "apps/playground/dist",
});

export interface MoyaForgeConfig {
  paths?: Partial<typeof DEFAULT_MOYAFORGE_PATHS>;
  [key: string]: unknown;
}

export function defineMoyaForgeConfig(config: MoyaForgeConfig = {}) {
  return {
    ...config,
    paths: {
      ...DEFAULT_MOYAFORGE_PATHS,
      ...(config.paths ?? {}),
    },
  };
}

export * from "./content.js";
export { buildNavigation } from "./navigation.js";
export * from "./components/index.js";
export { createMdxComponents, moyaForgeComponents } from "./mdx.js";
