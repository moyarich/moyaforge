import type { TocSetting } from "../../registry/index.js";
import type { TocHeading, ResolvedTocOptions } from "./toc.types.js";
import { resolveTocOptions } from "./resolve-toc-options.js";
import { filterTableOfContents } from "./filter-table-of-contents.js";

/**
 * Resolve TOC settings and filter headings for rendering.
 * Automatically sets placement to none when there are no displayable headings.
 * @param headings - Original compiler-derived heading tree.
 * @param page - Optional page-level setting.
 * @param project - Fallback project-level setting.
 * @returns Resolved display options and filtered headings.
 */
export function getTableOfContents(
  headings: readonly TocHeading[],
  page?: TocSetting,
  project?: TocSetting,
): { options: ResolvedTocOptions; headings: TocHeading[] } {
  const options = resolveTocOptions(page, project);
  const filtered = filterTableOfContents(headings, page, project);
  return {
    options: filtered.length ? options : { ...options, placement: "none" },
    headings: filtered,
  };
}
