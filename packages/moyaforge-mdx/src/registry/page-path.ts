const PREFIX = /^\d+[-_ ]/;
/** Derive a readable fallback title by removing order prefixes and word separators. */
export const titleFromSegment = (value: string) =>
  value
    .replace(PREFIX, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (v) => v.toUpperCase());

/**
 * Resolve a source-relative content filename to its logical directory segments.
 * Canonical page.md/page.mdx filenames do not add a segment; other documents do.
 * @throws {Error} For absolute/traversing paths or non-Markdown extensions.
 */
export function getContentPathSegments(file: string): string[] {
  const safe = file.replace(/\\/g, "/").replace(/^\.\//, "");
  if (safe.startsWith("/") || safe.split("/").includes(".."))
    throw Error(`${file}: invalid content path`);
  if (!/\.mdx?$/.test(safe))
    throw Error(`${file}: expected Markdown or MDX file`);
  const parts = safe.split("/");
  const filename = parts.pop()!;
  return /^page\.mdx?$/.test(filename)
    ? parts
    : [...parts, filename.replace(/\.mdx?$/, "")];
}

/**
 * Resolve explicit order, then the final segment's numeric prefix.
 * Source roots default to -1; unnumbered pages default to Number.MAX_SAFE_INTEGER.
 */
export function getPageOrder(
  segments: readonly string[],
  explicitOrder?: number,
): number {
  return (
    explicitOrder ??
    (segments.length === 0
      ? -1
      : Number(
          /^(\d+)[-_ ]/.exec(segments.at(-1)!)?.[1] ?? Number.MAX_SAFE_INTEGER,
        ))
  );
}
