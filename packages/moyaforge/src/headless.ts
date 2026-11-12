/** Framework routing exports without installable documentation UI. */
export {
  HeadlessDocsRoutes,
  type HeadlessDocsRoutesProps,
} from "./routing/HeadlessDocsRoutes.js";
export {
  RegistryRouteView,
  type RegistryRouteViewProps,
  type RegistryLazySources,
} from "./routing/RegistryRoutes.js";

export {
  DocumentationLink,
  DocumentationRoutesContext,
} from "./routing/DocumentationLink.js";
export {
  resolveDocumentationHref,
  type DocumentationRoute,
} from "./routing/documentation-links.js";
export { createContentRouting } from "./routing/createContentRouting.js";
export { useDocumentationHash } from "./routing/useDocumentationHash.js";
