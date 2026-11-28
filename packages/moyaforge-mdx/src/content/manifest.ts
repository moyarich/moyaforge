import type { TocHeading } from "../navigation/toc/index.js";
import type { RegistryPage } from "../registry/index.js";
import type { DiscoveredContent } from "./discovery.js";

/** One canonical page record for routing, navigation, TOC and search consumers. */
export interface ContentManifestEntry extends RegistryPage {
  headings: TocHeading[];
}

/**
 * Join routable registry pages with their compiler-derived heading trees.
 * Preserves registry order and includes hidden routes; disabled pages are omitted.
 * @param content - Discovered registry and headings keyed by source/filename.
 * @returns Canonical page records with headings, using an empty array when none exist.
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
