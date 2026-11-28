import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { discoverContent, type ContentSourcesConfig } from "./discovery.js";
import { validateInternalLinks, type LinkIssue } from "./links.js";

/**
 * Check authored internal links using the same discovery configuration as the site.
 * @param config - Content sources and discovery options.
 * @param root - Application root used to resolve source directories.
 * @returns A promise resolving to all link issues; an empty array means no issues were found.
 * @throws If content discovery or file reading fails.
 */
export async function checkContentLinks(
  config: ContentSourcesConfig,
  root: string,
): Promise<LinkIssue[]> {
  const { registry, headings } = await discoverContent(config, root);
  const documents = await Promise.all(
    registry.pages.map(async (page) => ({
      source: page.source,
      file: page.file,
      filename: resolve(root, config.sources[page.source].base, page.file),
      content: await readFile(
        resolve(root, config.sources[page.source].base, page.file),
        "utf8",
      ),
    })),
  );
  return validateInternalLinks(documents, registry, headings);
}

/**
 * Format link issues for terminal and CI logs in input order.
 * @param issues - Link validation results.
 * @returns One file, reason and href per line; an empty string for no issues.
 */
export function formatLinkIssues(issues: readonly LinkIssue[]): string {
  return issues
    .map(({ file, href, reason }) => `${file}: ${reason}: ${href}`)
    .join("\n");
}
