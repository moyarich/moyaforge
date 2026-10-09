import type { ReactNode } from "react";
import type { MoyaForgeSource, SourcePage } from "../../utils/content/source.js";
import { DocsLayout, type DocsLayoutProps } from "../DocsLayout/DocsLayout.js";

export interface DocsRoutesProps {
  source: MoyaForgeSource;
  pathname: string;
  layout?: Omit<DocsLayoutProps, "pages" | "currentUrl" | "children">;
  renderPage?: (page: SourcePage) => ReactNode;
  notFound?: ReactNode;
}
/** Router-independent docs route renderer: integrate with React Router, TanStack Router or a host app. */
export function DocsRoutes({ source, pathname, layout, renderPage, notFound = <p>Page not found.</p> }: DocsRoutesProps) {
  const path = "/" + pathname.split("/").filter(Boolean).join("/");
  const page = source.getPage(path);
  if (!page) return <>{notFound}</>;
  const Page = page.Component;
  return <DocsLayout pages={source.getPages()} currentUrl={path} {...layout}>
    {renderPage ? renderPage(page) : Page ? <Page /> : <p>This page has no rendered component.</p>}
  </DocsLayout>;
}
