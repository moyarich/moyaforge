import type { TocSetting } from "../../registry/index.js";
import type { TocHeading } from "./toc.types.js";
import { resolveTocOptions } from "./resolve-toc-options.js";

/** Preserve original anchor IDs and nest only headings within configured depths. */
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
