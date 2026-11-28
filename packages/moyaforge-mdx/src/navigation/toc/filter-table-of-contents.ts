import type { TocSetting } from "../../registry/index.js";
import type { TocHeading } from "./toc.types.js";
import { resolveTocOptions } from "./resolve-toc-options.js";

/**
 * Filter the heading tree according to resolved page or project TOC settings.
 * Preserves anchor IDs, promotes children of headings shallower than minDepth, and omits branches deeper than maxDepth.
 * @param headings - Original compiler-derived heading tree.
 * @param setting - Optional page-level TOC setting.
 * @param project - Fallback project TOC setting.
 * @returns A new filtered heading tree, or an empty array when TOC is disabled.
 */
export function filterTableOfContents(
  headings: readonly TocHeading[],
  setting?: TocSetting,
  project?: TocSetting,
): TocHeading[] {
  const options = resolveTocOptions(setting, project);
  if (options.placement === "none") return [];
  const result: TocHeading[] = [];
  const append = (entries: readonly TocHeading[], target: TocHeading[]) => {
    for (const heading of entries) {
      if (heading.depth > options.maxDepth) continue;
      if (heading.depth < options.minDepth) {
        append(heading.children ?? [], target);
        continue;
      }
      const item: TocHeading = {
        id: heading.id,
        value: heading.value,
        depth: heading.depth,
      };
      const children: TocHeading[] = [];
      append(heading.children ?? [], children);
      if (children.length) item.children = children;
      target.push(item);
    }
  };
  append(headings, result);
  return result;
}
