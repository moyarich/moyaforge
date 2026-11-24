import type { TocSetting } from "../../registry/index.js";
import type { TocHeading, ResolvedTocOptions } from "./toc.types.js";
import { resolveTocOptions } from "./resolve-toc-options.js";
import { filterTableOfContents } from "./filter-table-of-contents.js";

/** Return display-ready TOC state, suppressing empty heading trees automatically. */
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
