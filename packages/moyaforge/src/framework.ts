/** Default directory names for source, documentation, API content and build output. */
export const DEFAULT_MOYAFORGE_PATHS = Object.freeze({
  source: "src",
  docs: "docs",
  api: "api",
  output: "dist",
});

/** Integration mode: documentation site, application primitives, or both. */
export type MoyaForgeMode = "docs" | "app" | "hybrid";

/** Site-level metadata and navigation settings. */
export interface MoyaForgeSiteConfig {
  /** Display title of the documentation site. */
  title?: string;
  /** Short site description. */
  description?: string;
  /** Base URL path for the site. */
  base?: string;
  /** Repository and optional branch used for edit links. */
  editLink?: { repository: string; branch?: string };
}

/** Locations of documentation, examples and API content. */
export interface MoyaForgeContentConfig {
  /** Documentation content location. */
  docs?: string;
  /** Example content location. */
  examples?: string;
  /** API content location. */
  api?: string;
}

/** Extensible configuration for a MoyaForge site or application. */
export interface MoyaForgeConfig {
  /** docs: turnkey documentation, app: opt-in primitives, hybrid: both. */
  mode?: MoyaForgeMode;
  /** Site metadata and edit-link settings. */
  site?: MoyaForgeSiteConfig;
  /** Content locations. */
  content?: MoyaForgeContentConfig;
  /** Overrides for individual default directory names. */
  paths?: Partial<typeof DEFAULT_MOYAFORGE_PATHS>;
  [key: string]: unknown;
}

/**
 * Define a typed MoyaForge configuration with default directory names.
 * Defaults to hybrid mode and merges supplied paths over DEFAULT_MOYAFORGE_PATHS.
 * @param config - Optional site, content, mode and path overrides.
 * @returns Configuration with merged paths and preserved custom properties.
 * @example defineMoyaForgeConfig({ mode: "docs", paths: { docs: "guide" } });
 */
export function defineMoyaForgeConfig(config: MoyaForgeConfig = {}) {
  return {
    mode: config.mode ?? "hybrid",
    ...config,
    paths: {
      ...DEFAULT_MOYAFORGE_PATHS,
      ...(config.paths ?? {}),
    },
  };
}
