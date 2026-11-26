import type { PageFrontmatter } from "./registry.types.js";

/** Report a metadata error with the authored filename attached. */
type ValidationFailure = (message: string) => never;

/** Allowed values and keys, kept as data rather than inline literals. */
const RULES = {
  stringKeys: ["title", "description", "icon"],
  iconPattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  navigation: new Set(["visible", "hidden", "disabled"]),
  sidebarBooleanKeys: ["group", "collapsible", "defaultOpen"],
  tocPlacements: new Set(["right", "sidebar", "inline", "none"]),
  tocBooleanKeys: ["collapsible", "defaultOpen"],
  tocDepth: { min: 1, max: 6 },
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/**
 * Validate untrusted YAML metadata and narrow it to the page frontmatter schema.
 * Omitted fields retain registry defaults. Unknown fields are preserved, while
 * removed page/sidebar labels are rejected in favor of the page title.
 *
 * @param meta Parsed metadata; no unchecked cast is required by the caller.
 * @param file Authored filename included in every validation error.
 * @throws {Error} When a known field has an invalid type or value.
 */
export function validatePageFrontmatter(
  meta: unknown,
  file: string,
): asserts meta is PageFrontmatter {
  const fail: ValidationFailure = (message) => {
    throw new Error(`${file}: ${message}`);
  };

  if (!isRecord(meta)) fail("frontmatter must be an object");

  for (const key of RULES.stringKeys) {
    if (meta[key] !== undefined && typeof meta[key] !== "string")
      fail(`${key} must be a string`);
  }
  if ("label" in meta) fail("use title instead of label in page frontmatter");
  if (typeof meta.title === "string" && !meta.title.trim())
    fail("title must not be empty");
  if (typeof meta.icon === "string" && !RULES.iconPattern.test(meta.icon))
    fail("icon must be a Lucide icon name in kebab case");
  if (
    meta.order !== undefined &&
    (typeof meta.order !== "number" || !Number.isFinite(meta.order))
  )
    fail("order must be a finite number");
  if (
    meta.navigation !== undefined &&
    (typeof meta.navigation !== "string" ||
      !RULES.navigation.has(meta.navigation))
  )
    fail("invalid navigation mode");

  if (meta.sidebar !== undefined) validateSidebar(meta.sidebar, fail);

  if (meta.toc !== undefined && typeof meta.toc !== "boolean")
    validateToc(meta.toc, fail);
}

/** Validate optional source-heading disclosure settings without changing their values. */
function validateSidebar(sidebar: unknown, fail: ValidationFailure): void {
  if (!isRecord(sidebar)) fail("sidebar must be an object");
  for (const key of RULES.sidebarBooleanKeys) {
    if (sidebar[key] !== undefined && typeof sidebar[key] !== "boolean")
      fail(`sidebar ${key} must be boolean`);
  }
  if ("label" in sidebar) fail("sidebar label is removed; use the page title");
}

/** Validate TOC placement, heading-depth bounds, and disclosure settings. */
function validateToc(toc: unknown, fail: ValidationFailure): void {
  if (!isRecord(toc)) fail("invalid toc setting");

  const { placement, minDepth, maxDepth } = toc;
  const { min, max } = RULES.tocDepth;

  if (
    placement !== undefined &&
    (typeof placement !== "string" || !RULES.tocPlacements.has(placement))
  )
    fail("invalid toc placement");
  if (
    [minDepth, maxDepth].some(
      (depth) =>
        depth !== undefined &&
        (typeof depth !== "number" ||
          !Number.isInteger(depth) ||
          depth < min ||
          depth > max),
    )
  )
    fail(`toc depths must be integers from ${min} to ${max}`);
  if (
    typeof minDepth === "number" &&
    typeof maxDepth === "number" &&
    minDepth > maxDepth
  )
    fail("toc minDepth exceeds maxDepth");
  for (const key of RULES.tocBooleanKeys) {
    if (toc[key] !== undefined && typeof toc[key] !== "boolean")
      fail(`toc ${key} must be boolean`);
  }
  if (toc.label !== undefined && typeof toc.label !== "string")
    fail("toc label must be a string");
}
