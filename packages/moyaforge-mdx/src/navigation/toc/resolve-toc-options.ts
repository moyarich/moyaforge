import type { TocSetting } from "../../registry/index.js";
import type { ResolvedTocOptions } from "./toc.types.js";

const defaults: ResolvedTocOptions = {
  placement: "right",
  label: "On this page",
  minDepth: 2,
  maxDepth: 3,
  collapsible: false,
  defaultOpen: true,
};

/**
 * Resolve page-level or project-level TOC settings against built-in defaults.
 * An explicit page setting replaces the project setting rather than merging with it. False disables placement.
 * @param page - Page override, when supplied.
 * @param project - Project fallback, when supplied.
 * @returns Complete TOC options; defaults to right placement, depths 2–3 and label On this page.
 * @example resolveTocOptions(false, true).placement // 'none'
 */
export function resolveTocOptions(
  page?: TocSetting,
  project?: TocSetting,
): ResolvedTocOptions {
  const value = page ?? project ?? true;
  if (value === false) return { ...defaults, placement: "none" };
  if (value === true) return { ...defaults };
  return { ...defaults, ...value };
}
