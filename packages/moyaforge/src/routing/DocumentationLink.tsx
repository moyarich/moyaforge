import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
} from "react";
import { Link, useLocation } from "react-router-dom";
import {
  resolveDocumentationHref,
  type DocumentationRoute,
} from "./documentation-links.js";

export const DocumentationRoutesContext = createContext<
  readonly DocumentationRoute[]
>([]);

type DocumentationLinkProps = ComponentPropsWithoutRef<"a">;

/**
 * Renders registry-known internal links with the router's `Link`.
 * Unknown, external, or non-string hrefs fall back to a native `<a>`.
 */
export function DocumentationLink({
  href,
  children,
  ...props
}: DocumentationLinkProps) {
  const { pathname } = useLocation();
  const routes = useContext(DocumentationRoutesContext);

  const destination =
    typeof href === "string"
      ? resolveDocumentationHref(href, pathname, routes)
      : null;

  if (destination === null) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link to={destination} {...props}>
      {children}
    </Link>
  );
}
