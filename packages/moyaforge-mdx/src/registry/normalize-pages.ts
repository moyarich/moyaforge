import { createPageId } from "./create-page-id.js";
import {
  getContentPathSegments,
  getPageOrder,
  titleFromSegment,
} from "./page-path.js";
import { validatePageFrontmatter } from "./validate-page-frontmatter.js";
import type { PageInput, RegistryPage, TocSetting } from "./registry.types.js";

const DEFAULT_TOC: TocSetting = {
  placement: "right",
  minDepth: 2,
  maxDepth: 3,
};

/** Validated metadata and path segments retained for both normalization passes. */
interface Entry {
  input: PageInput;
  meta: NonNullable<PageInput["frontmatter"]>;
  dirs: string[];
}

/** Validate and parse each input exactly once. */
function prepareEntries(inputs: readonly PageInput[]): Entry[] {
  return inputs.map((input) => {
    const meta = input.frontmatter ?? {};
    validatePageFrontmatter(meta, input.file);
    return { input, meta, dirs: getContentPathSegments(input.file) };
  });
}

/** Default title for a page: explicit title, else derived from its last path segment. */
function rawTitle(entry: Entry, source: string): string {
  return entry.meta.title ?? titleFromSegment(entry.dirs.at(-1) ?? source);
}

/**
 * Build a resolver that turns a directory path into route segments, using each
 * ancestor page's title-derived id when a page exists for that directory.
 */
function createRouteResolver(source: string, entries: readonly Entry[]) {
  const titleIds = new Map(
    entries.map((entry) => [
      entry.dirs.join("/"),
      createPageId(rawTitle(entry, source)),
    ]),
  );

  return (dirs: readonly string[]): string[] =>
    dirs.map(
      (segment, index) =>
        titleIds.get(dirs.slice(0, index + 1).join("/")) ??
        createPageId(titleFromSegment(segment)),
    );
}

/** Keep ordering deterministic across source enumeration and filesystem discovery. */
function sortPages(a: RegistryPage, b: RegistryPage): number {
  return (
    a.source.localeCompare(b.source) ||
    a.order - b.order ||
    a.path.localeCompare(b.path)
  );
}

/**
 * Normalize source manifests into ordered pages with title-derived routes.
 * Resolve ancestor titles before children so input discovery order cannot change URLs.
 * Source landing pages retain their source-root route.
 * @param sources Source-relative documents grouped by source key.
 * @param options Project-level defaults for page presentation.
 * @returns All normalized pages, including hidden and disabled documents.
 * @throws {Error} For invalid metadata, invalid content paths, or route collisions.
 */
export function normalizePages(
  sources: Record<string, readonly PageInput[]>,
  options: { toc?: TocSetting } = {},
): RegistryPage[] {
  // Validate project-level TOC defaults even when no page overrides them.
  if (options.toc !== undefined) {
    validatePageFrontmatter({ toc: options.toc }, "registry.config.ts");
  }
  const defaultToc = options.toc ?? DEFAULT_TOC;

  const seenPaths = new Map<string, string>();
  const pages: RegistryPage[] = [];

  for (const [source, inputs] of Object.entries(sources)) {
    const entries = prepareEntries(inputs);
    const resolveSegments = createRouteResolver(source, entries);

    for (const entry of entries) {
      const { input, meta, dirs } = entry;
      const fileKey = `${source}/${input.file}`;

      const path =
        "/" + [source, ...resolveSegments(dirs)].filter(Boolean).join("/");

      const previous = seenPaths.get(path);
      if (previous) {
        throw new Error(`Duplicate route ${path}: ${previous} and ${fileKey}`);
      }
      seenPaths.set(path, fileKey);

      const title = rawTitle(entry, source);
      const parentPath = dirs.length
        ? "/" + [source, ...resolveSegments(dirs.slice(0, -1))].join("/")
        : null;

      pages.push({
        source,
        file: input.file,
        path,
        id: createPageId(title),
        title: meta.title?.trim() ?? title,
        description: meta.description,
        ...(meta.icon && { icon: meta.icon }),
        order: getPageOrder(dirs, meta.order),
        navigation: meta.navigation ?? "visible",
        ...(meta.sidebar && { sidebar: meta.sidebar }),
        toc: meta.toc ?? defaultToc,
        parentPath,
      });
    }
  }

  return pages.sort(sortPages);
}
