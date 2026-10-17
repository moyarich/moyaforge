import "./DocsLayout.css";
import { useEffect, useState, type ReactNode } from "react";

/** Page metadata needed by the editable documentation layout. */
export interface DocsLayoutPage {
  url: string;
  title?: string;
  label?: string;
  sourcePath?: string;
  frontmatter?: {
    navigation?: string;
    hidden?: boolean;
  };
}

/** Heading data is supplied by the host, not loaded from the framework. */
export interface DocsLayoutHeading {
  id: string;
  text?: string;
  title?: string;
  depth: number;
  children?: readonly DocsLayoutHeading[];
}

export interface DocsLayoutProps {
  pages: readonly DocsLayoutPage[];
  currentUrl?: string;
  children: ReactNode;
  title?: string;
  header?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
  outline?: ReactNode;
  toc?:
    | false
    | {
        placement?: "right" | "sidebar" | "inline" | "none";
        label?: string;
        headings: readonly DocsLayoutHeading[];
        collapsible?: boolean;
        defaultOpen?: boolean;
        minDepth?: number;
        maxDepth?: number;
      };
  editLink?: { repository: string; branch?: string };
}

function visibleHeadings(
  headings: readonly DocsLayoutHeading[],
  min: number,
  max: number,
): DocsLayoutHeading[] {
  return headings.flatMap((heading) => {
    const children = visibleHeadings(heading.children ?? [], min, max);
    if (heading.depth < min) return children;
    if (heading.depth > max) return [];
    return [{ ...heading, children }];
  });
}

function HeadingLinks({
  headings,
  activeId,
}: {
  headings: readonly DocsLayoutHeading[];
  activeId: string;
}) {
  return (
    <ul>
      {headings.map((heading) => (
        <li key={heading.id}>
          <a href={`#${heading.id}`} aria-current={activeId === heading.id ? "location" : undefined}>
            {heading.text ?? heading.title ?? heading.id}
          </a>
          {heading.children?.length ? (
            <HeadingLinks headings={heading.children} activeId={activeId} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Framework-independent documentation chrome. Supply data and custom slots from the host. */
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
  const [activeId, setActiveId] = useState("");
  useEffect(() => {
    const update = () => setActiveId(decodeURIComponent(window.location.hash.slice(1)));
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const current = pages.find((page) => page.url === currentUrl);
  const visiblePages = pages.filter(
    (page) =>
      page.frontmatter?.navigation !== "hidden" &&
      page.frontmatter?.navigation !== "disabled" &&
      page.frontmatter?.hidden !== true,
  );
  const placement = toc === false ? "none" : (toc?.placement ?? "right");
  const headings = toc
    ? visibleHeadings(toc.headings, toc.minDepth ?? 2, toc.maxDepth ?? 3)
    : [];
  const configuredOutline = headings.length ? (
    <nav aria-label={toc && toc.label ? toc.label : "On this page"}>
      <strong>{toc && toc.label ? toc.label : "On this page"}</strong>
      <HeadingLinks headings={headings} activeId={activeId} />
    </nav>
  ) : null;
  const sidebarContent = (
    <nav aria-label="Documentation navigation">
      <ul>
        {visiblePages.map((page) => (
          <li key={page.url}>
            <a
              href={page.url}
              aria-current={page.url === currentUrl ? "page" : undefined}
            >
              {page.title ?? page.label ?? page.url}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
  const editHref =
    current?.sourcePath && editLink
      ? `${editLink.repository.replace(/\/$/, "")}/edit/${encodeURIComponent(editLink.branch ?? "main")}/${current.sourcePath.split("/").map(encodeURIComponent).join("/")}`
      : undefined;

  return (
    <div data-moyaforge-docs-layout="">
      <header data-moyaforge-docs-header="">
        {header ?? <a href={visiblePages[0]?.url ?? "/"}>{title}</a>}
      </header>
      <div data-moyaforge-docs-columns="">
        {sidebar !== undefined ? (
          sidebar
        ) : (
          <aside data-moyaforge-docs-sidebar="">
            {sidebarContent}
            {placement === "sidebar" ? configuredOutline : null}
          </aside>
        )}
        <main data-moyaforge-docs-article="">
          {placement === "inline" ? configuredOutline : null}
          {children}
          {editHref ? (
            <footer data-moyaforge-docs-page-footer="">
              <a href={editHref}>Edit this page</a>
            </footer>
          ) : null}
          {footer}
        </main>
        {outline !== undefined
          ? outline
          : placement === "right" && configuredOutline
            ? <aside data-moyaforge-doc-outline="">{configuredOutline}</aside>
            : null}
      </div>
    </div>
  );
}
