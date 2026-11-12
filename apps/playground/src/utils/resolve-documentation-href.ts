import { DocumentationRoute } from "../context/documentation-routes-context";

/** Resolve MDX links against public routes discovered by the registry, not filesystem paths. */
export function resolveDocumentationHref(
  href: string,
  pathname: string,
  availableRoutes: readonly DocumentationRoute[] = [],
) {
  if (
    !href ||
    /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href) ||
    href.startsWith("?")
  )
    return null;
  const [pathAndQuery, fragment] = href.split("#", 2);
  const [path, query] = pathAndQuery.split("?", 2);
  const parts = path.startsWith("/") ? [] : pathname.split("/").filter(Boolean);
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  const candidate =
    ("/" + parts.join("/"))
      .replace(/\/(?:page\.mdx?|index\.html?)$/, "")
      .replace(/\/$/, "") || "/";
  const target = availableRoutes.find(
    (page) => page.path === candidate && page.navigation !== "disabled",
  );
  // Don't reinterpret non-page links as routes.
  if (!target) return null;
  return (
    target.path +
    (query !== undefined ? "?" + query : "") +
    (fragment !== undefined ? "#" + fragment : "")
  );
}
