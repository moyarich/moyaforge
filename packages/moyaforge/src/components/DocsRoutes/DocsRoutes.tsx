import type { ReactNode } from "react";
import type {
  MoyaForgeSource,
  SourcePage,
} from "../../utils/content/source.js";
import { HeadlessDocsRoutes } from "../Routing/HeadlessDocsRoutes.js";
import {
  DocsLayout,
  type DocsLayoutProps,
} from "../Layout/DocsLayout/DocsLayout.js";

export interface DocsRoutesProps {
  source: MoyaForgeSource;
  pathname: string;
  layout?: Omit<DocsLayoutProps, "pages" | "currentUrl" | "children">;
  renderPage?: (page: SourcePage) => ReactNode;
  notFound?: ReactNode;
}
/** Router-independent docs route renderer: integrate with React Router, TanStack Router or a host app. */
export function DocsRoutes({
  source,
  pathname,
  layout,
  renderPage,
  notFound = <p>Page not found.</p>,
}: DocsRoutesProps) {
  return (
    <HeadlessDocsRoutes
      source={source}
      pathname={pathname}
      renderPage={renderPage}
      notFound={notFound}
      renderLayout={(_page, content) => (
        <DocsLayout
          pages={source.getPages()}
          currentUrl={"/" + pathname.split("/").filter(Boolean).join("/")}
          {...layout}
        >
          {content}
        </DocsLayout>
      )}
    />
  );
}
