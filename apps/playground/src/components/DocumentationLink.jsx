import { useLocation, Link } from "react-router-dom";

/** Resolve authored MDX links against the current docs route under HashRouter. */
export function resolveDocumentationHref(href, pathname) {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return null;
  if (href.startsWith("?")) return null;
  const [pathAndQuery, fragment] = href.split("#", 2);
  const [path, query] = pathAndQuery.split("?", 2);
  // Paths relative to the current page are resolved as directory links,
  // mirroring the link validator's canonical route convention.
  const segments = path.startsWith("/")
    ? []
    : pathname.split("/").filter(Boolean);
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }
  let target = "/" + segments.join("/");
  target =
    target.replace(/\/(?:page\.mdx?|index\.html?)$/, "").replace(/\/$/, "") ||
    "/";
  return (
    target +
    (query !== undefined ? "?" + query : "") +
    (fragment !== undefined ? "#" + fragment : "")
  );
}

/** Preserve external links and let React Router handle internal routes and anchors. */
export function DocumentationLink({ href, children, ...props }) {
  const { pathname } = useLocation();
  const destination =
    typeof href === "string" ? resolveDocumentationHref(href, pathname) : null;
  return destination === null ? (
    <a href={href} {...props}>
      {children}
    </a>
  ) : (
    <Link to={destination} {...props}>
      {children}
    </Link>
  );
}
