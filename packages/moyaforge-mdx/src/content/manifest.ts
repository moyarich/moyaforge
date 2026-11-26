import type { TocHeading } from "../navigation/toc/index.js";
import type { RegistryPage } from "../registry/index.js";
import type { DiscoveredContent } from "./discovery.js";

/** One canonical page record for routing, navigation, TOC and search consumers. */
export interface ContentManifestEntry extends RegistryPage {
  headings: TocHeading[];
}

/**
 * Join the MDX-owned route registry with its compiler-derived headings.
 * Only routable pages are published. Entries use the registry's deterministic
 * ordering, keeping hidden-but-routable pages available to deep links.
 */
export function createContentManifest({
  registry,
  headings,
}: Pick<DiscoveredContent, "registry" | "headings">): ContentManifestEntry[] {
  return registry.routes.map((page) => ({
    ...page,
    headings: headings[`${page.source}/${page.file}`] ?? [],
  }));
}
