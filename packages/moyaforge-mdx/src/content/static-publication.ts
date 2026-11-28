import type { ContentManifestEntry } from "./manifest.js";
import { createStaticPageMetadata } from "./static-metadata.js";

export interface StaticPublicationOptions {
  /** The absolute public origin, optionally including a deployment base path. */
  origin: string;
  title?: string;
  /** Hidden routes are routable but omitted from published listings by default. */
  includeHidden?: boolean;
}

/**
 * Generate static publication metadata, a search index and llms.txt from canonical routes.
 * Hidden pages are excluded unless requested; disabled pages are never published.
 * @param manifest - Canonical page records with headings.
 * @param options - Public HTTP(S) origin, optional title and hidden-page policy.
 * @returns Metadata with absolute URLs, searchIndex and llmsTxt.
 * @throws If the origin is invalid, non-HTTP(S), or contains a query or fragment.
 */
export function createStaticPublication(
  manifest: readonly ContentManifestEntry[],
  options: StaticPublicationOptions,
) {
  const origin = new URL(options.origin);
  if (!["https:", "http:"].includes(origin.protocol))
    throw new Error("Static publication origin must be an HTTP(S) URL");
  if (origin.search || origin.hash)
    throw new Error(
      "Static publication origin must not include a query or fragment",
    );
  const base = origin.href.replace(/\/$/, "");
  const selected = manifest.filter(
    (page) =>
      page.navigation === "visible" ||
      (options.includeHidden === true && page.navigation === "hidden"),
  );
  const metadata = createStaticPageMetadata(selected);
  const pages = metadata.map((page) => ({
    ...page,
    url:
      base +
      "/" +
      page.path
        .replace(/^\/+/, "")
        .split("/")
        .map(encodeURIComponent)
        .join("/"),
  }));
  const searchIndex = pages.map((page) => ({
    url: page.url,
    title: page.title,
    description: page.description ?? "",
    headings: page.headings,
  }));
  const title = (options.title ?? "Documentation")
    .replace(/[\r\n]+/g, " ")
    .trim();
  const llmsTxt = [
    "# " + title,
    "",
    ...pages.map((page) => {
      const label = page.title.replace(/[\r\n]+/g, " ").replace(/[\[\]]/g, "");
      const description = (page.description ?? "")
        .replace(/[\r\n]+/g, " ")
        .trim();
      return (
        "- [" +
        label +
        "](" +
        page.url +
        ")" +
        (description ? ": " + description : "")
      );
    }),
    "",
  ].join("\n");
  return { metadata: pages, searchIndex, llmsTxt };
}
