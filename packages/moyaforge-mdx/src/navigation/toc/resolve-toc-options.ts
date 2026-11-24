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

/** A page's explicit false overrides even an enabled project default. */
export function resolveTocOptions(
  page?: TocSetting,
  project?: TocSetting,
): ResolvedTocOptions {
  const value = page ?? project ?? true;
  if (value === false) return { ...defaults, placement: "none" };
  if (value === true) return { ...defaults };
  return { ...defaults, ...value };
}
