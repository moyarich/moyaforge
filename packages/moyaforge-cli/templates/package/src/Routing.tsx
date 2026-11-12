import { Link } from "react-router-dom";
import {
  createContentRouting,
  DocumentationLink,
} from "@moyarich/moyaforge/headless";
import { RegistryRoutes } from "@moyarich/moyaforge/registry-routes";
import { routes } from "virtual:moyaforge-mdx/metadata";

export const documentationLinkComponents = { a: DocumentationLink };

const contentRouting = createContentRouting(routes);
export const resolveSearchPages = contentRouting.searchResultPages;

export function ContentPage() {
  return (
    <RegistryRoutes
      notFound={
        <>
          <h1>Page not found</h1>
          <Link to="/docs">Documentation</Link>
        </>
      }
    />
  );
}
