import type { ReactNode } from "react";
import type { SourcePage } from "../../utils/content/source.js";
import { EditPageLink } from "../EditPageLink/EditPageLink.js";
import { DocOutline, type DocHeading } from "../DocOutline/DocOutline.js";

export interface DocsLayoutProps {
  pages: readonly SourcePage[];
  currentUrl?: string;
  children: ReactNode;
  title?: string;
  header?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
  outline?: ReactNode;
  /** Optional normalized TOC input from the content metadata registry. */
  toc?:
    | false
    | {
        placement?: "right" | "sidebar" | "inline" | "none";
        label?: string;
        headings: readonly DocHeading[];
        collapsible?: boolean;
        defaultOpen?: boolean;
        minDepth?: number;
        maxDepth?: number;
      };
  editLink?: { repository: string; branch?: string };
}
export function DocsLayout({
  pages,
  currentUrl,
  children,
  title = "Documentation",
  header,
  footer,
  sidebar,
  outline,
  toc,
  editLink,
}: DocsLayoutProps) {
  const current = pages.find((page) => page.url === currentUrl);
  const visiblePages = pages.filter(
    (page) => page.frontmatter.navigation !== "hidden" &&
      page.frontmatter.navigation !== "disabled" &&
      page.frontmatter.hidden !== true,
  );
  const placement = toc === false ? "none" : (toc?.placement ?? "right");
  const filtered = toc
    ? filterDepth(toc.headings, toc.minDepth ?? 2, toc.maxDepth ?? 3)
    : undefined;
  const configuredOutline = filtered?.length ? (
    <DocOutline
      headings={filtered}
      title={toc && toc.label ? toc.label : "On this page"}
      collapsible={Boolean(toc && toc.collapsible)}
      defaultOpen={toc ? (toc.defaultOpen ?? true) : true}
    />
  ) : null;
  return (
    <div data-moyaforge-docs-layout="">
      <header data-moyaforge-docs-header="">
        {header ?? <a href={visiblePages[0]?.url ?? "/"}>{title}</a>}
      </header>
      <div data-moyaforge-docs-columns="">
        <aside
          data-moyaforge-docs-sidebar=""
          aria-label="Documentation navigation"
        >
          {sidebar ?? (
            <nav>
              <ul>
                {visiblePages.map((page) => (
                  <li key={page.url}>
                    <a
                      href={page.url}
                      aria-current={
                        page.url === currentUrl ? "page" : undefined
                      }
                    >
                      {page.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {toc && placement === "sidebar" ? configuredOutline : null}
        </aside>
        <main data-moyaforge-docs-article="">
          {toc && placement === "inline" ? configuredOutline : null}
          {children}
          {current && editLink ? (
            <footer data-moyaforge-docs-page-footer="">
              <EditPageLink
                repository={editLink.repository}
                branch={editLink.branch}
                path={current.sourcePath}
              />
            </footer>
          ) : null}
          {footer}
        </main>
        {outline ??
          (toc === undefined ? (
            <DocOutline />
          ) : placement === "right" ? (
            configuredOutline
          ) : null)}
      </div>
    </div>
  );
}

function filterDepth(
  headings: readonly DocHeading[],
  min: number,
  max: number,
): DocHeading[] {
  return headings.flatMap((heading) => {
    const children = filterDepth(heading.children ?? [], min, max);
    if (heading.depth < min) return children;
    if (heading.depth > max) return [];
    return [{ ...heading, children }];
  });
}
