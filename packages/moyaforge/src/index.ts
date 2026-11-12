export {
  DEFAULT_MOYAFORGE_PATHS,
  defineMoyaForgeConfig,
  type MoyaForgeMode,
  type MoyaForgeSiteConfig,
  type MoyaForgeContentConfig,
  type MoyaForgeConfig,
} from "./framework.js";

// Framework-only helpers. Install UI components from the source registry.
export * from "./utils/content/index.js";
export * from "./utils/navigation/index.js";

export {
  RegistryRouteView,
  type RegistryRouteViewProps,
  type RegistryLazySources,
} from "./routing/RegistryRoutes.js";

export {
  HeadlessDocsRoutes,
  type HeadlessDocsRoutesProps,
} from "./routing/HeadlessDocsRoutes.js";
