const ORDER_PREFIX = /^\d+[-_. ]*/;

export function stripOrderPrefix(value) {
  return String(value).replace(ORDER_PREFIX, "");
}

export function labelFromSegment(segment) {
  return stripOrderPrefix(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function compareOrderedPaths(left, right) {
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function pagePathParts(path) {
  return String(path)
    .replace(/^\.\//, "")
    .replace(/\/page\.mdx?$/, "")
    .split("/")
    .filter(Boolean);
}

export function createPageDescriptor(path, module = {}) {
  const segments = pagePathParts(path);
  const frontmatter = module.frontmatter ?? {};
  const fallbackId = segments.join("/") || "index";

  return {
    id: frontmatter.id ?? fallbackId,
    label:
      frontmatter.label ??
      labelFromSegment(segments.at(-1) ?? frontmatter.title ?? "Home"),
    navPath: segments.map(labelFromSegment),
    path,
    frontmatter,
    Component: module.default,
    hidden: frontmatter.hidden === true,
  };
}

export function createPages(modules) {
  return Object.entries(modules)
    .map(([path, module]) => createPageDescriptor(path, module))
    .filter((page) => !page.hidden)
    .sort((left, right) => compareOrderedPaths(left.path, right.path));
}

export function filterPages(pages, query) {
  const value = String(query ?? "").trim().toLowerCase();
  if (!value) return [...pages];

  return pages.filter((page) =>
    [page.label, page.id, ...(page.navPath ?? [])]
      .filter(Boolean)
      .some((part) => String(part).toLowerCase().includes(value)),
  );
}
