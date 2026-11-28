import { globSync } from "tinyglobby";
import { resolve, relative, sep } from "node:path";

/**
 * Check whether the final path segment is exactly page.md or page.mdx.
 * @param file - File path with either slash convention.
 * @returns Whether the path matches the canonical landing-page filename.
 * @example isContentPageFile('guide/page.mdx') // true
 */
export function isContentPageFile(file: string): boolean {
  return /^page\.mdx?$/.test(
    file.replaceAll("\\", "/").split("/").at(-1) ?? "",
  );
}

export interface DiscoveredSourceFile {
  absolute: string;
  relative: string;
}

/**
 * Synchronously discover canonical page files for Vite compatibility adapters.
 * @param base - Directory to search.
 * @param include - Glob patterns; defaults to canonical Markdown and MDX pages.
 * @param exclude - Ignore glob patterns; defaults to none.
 * @returns Sorted absolute and base-relative paths with forward slashes.
 */
export function discoverSourceFilesSync(
  base: string,
  include: readonly string[] = ["**/page.{md,mdx}"],
  exclude: readonly string[] = [],
): DiscoveredSourceFile[] {
  const directory = resolve(base);
  return globSync([...include], {
    cwd: directory,
    ignore: [...exclude],
    absolute: true,
    onlyFiles: true,
  })
    .sort()
    .filter(isContentPageFile)
    .map((absolute) => ({
      absolute: absolute.split(sep).join("/"),
      relative: relative(directory, absolute).split(sep).join("/"),
    }));
}
