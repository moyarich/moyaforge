import type { ReactNode } from "react";
import type { SourcePage } from "../../utils/content/source.js";
import { EditPageLink } from "../EditPageLink/EditPageLink.js";
import { DocOutline } from "../DocOutline/DocOutline.js";

export interface DocsLayoutProps {
  pages: readonly SourcePage[];
  currentUrl?: string;
  children: ReactNode;
  title?: string;
  header?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
  outline?: ReactNode;
  editLink?: { repository: string; branch?: string };
}
export function DocsLayout({ pages, currentUrl, children, title = "Documentation", header, footer, sidebar, outline, editLink }: DocsLayoutProps) {
  const current = pages.find((page) => page.url === currentUrl);
  return <div data-moyaforge-docs-layout="">
    <header data-moyaforge-docs-header="">{header ?? <a href={pages[0]?.url ?? "/"}>{title}</a>}</header>
    <div data-moyaforge-docs-columns="">
      <aside data-moyaforge-docs-sidebar="" aria-label="Documentation navigation">
        {sidebar ?? <nav><ul>{pages.map((page) =>
          <li key={page.url}><a href={page.url} aria-current={page.url === currentUrl ? "page" : undefined}>{page.title}</a></li>)}</ul></nav>}
      </aside>
      <main data-moyaforge-docs-article="">
        {children}
        {current && editLink ? <footer data-moyaforge-docs-page-footer=""><EditPageLink repository={editLink.repository} branch={editLink.branch} path={current.sourcePath} /></footer> : null}
        {footer}
      </main>
      {outline ?? <DocOutline />}
    </div>
  </div>;
}
