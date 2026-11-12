import "./DocumentationSite.css";
import {
  DocumentationSearch,
  type DocumentationSearchProps,
} from "../../Search/DocumentationSearch.js";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface DocumentationSitePage {
  path: string;
  label: string;
  source?: string;
  /** Repository-relative path to the page's source file. */
  sourcePath?: string;
}
export interface DocumentationSiteProps {
  title: string;
  children: ReactNode;
  repository?: string;
  repositoryBranch?: string;
  pages?: readonly DocumentationSitePage[];
  currentPath?: string;
  sidebar?: ReactNode;
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  sidebarLabel?: string;
  sidebarVersion?: string;
  outline?: ReactNode;
  outlineHeader?: ReactNode;
  outlineFooter?: ReactNode;
  onSearch?: (query: string) => Promise<readonly DocumentationSitePage[]>;
  searchShortcut?: Pick<DocumentationSearchProps, "hotkey" | "kbd">;
  onNavigate?: (path: string) => void;
}

const defaultSearchShortcut = {
  hotkey: ["meta+k", "ctrl+k"],
  kbd: "⌘ K",
} as const;

/** Standalone documentation chrome. Routing, page discovery and search are provided by the consumer. */
export function DocumentationSite({
  title,
  children,
  repository,
  repositoryBranch = "main",
  pages = [],
  currentPath,
  sidebar,
  sidebarHeader,
  sidebarFooter,
  sidebarLabel,
  sidebarVersion,
  outline,
  outlineHeader,
  outlineFooter,
  onSearch,
  searchShortcut = defaultSearchShortcut,
  onNavigate,
}: DocumentationSiteProps) {
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(false);
  const article = useRef<HTMLElement>(null);
  useEffect(() => setMenu(false), [currentPath]);
  const currentIndex = pages.findIndex((page) => page.path === currentPath);
  const current = pages[currentIndex];
  const contributeHref =
    current?.sourcePath && repository
      ? `${repository.replace(/\/$/, "")}/edit/main/${current.sourcePath.split("/").map(encodeURIComponent).join("/")}`
      : repository;
  const navigate = (path: string) => {
    setMenu(false);
    onNavigate?.(path);
  };
  const link = (page: DocumentationSitePage, children: ReactNode) => (
    <a
      href={page.path}
      onClick={(event) => {
        if (
          onNavigate &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.button === 0
        ) {
          event.preventDefault();
          navigate(page.path);
        }
      }}
    >
      {children}
    </a>
  );
  return (
    <div className={`mf-docs${dark ? " mf-docs-dark" : ""}`}>
      <a className="mf-skip" href="#main">
        Skip to content
      </a>
      <header className="mf-header">
        <div className="mf-brand">
          {pages[0] ? link(pages[0], title) : title}
        </div>
        {onSearch && (
          <DocumentationSearch
            key={currentPath}
            search={onSearch}
            onNavigate={onNavigate ? navigate : undefined}
            {...searchShortcut}
          />
        )}
        <nav aria-label="Main navigation">
          {pages[0] ? link(pages[0], "Guide") : null}
          {repository ? <a href={repository}>GitHub ↗</a> : null}
          <button
            type="button"
            onClick={() => setDark((value) => !value)}
            aria-label="Toggle appearance"
          >
            {dark ? "☀" : "☾"}
          </button>
          <button
            type="button"
            className="mf-menu"
            onClick={() => setMenu((value) => !value)}
            aria-expanded={menu}
          >
            Menu
          </button>
        </nav>
      </header>
      <div
        className="mf-docs-grid"
        data-menu-open={menu}
        data-sidebar={sidebar === null ? "none" : undefined}
        data-outline={outline === null ? "none" : undefined}
      >
        {sidebar !== undefined ? (
          sidebar
        ) : (
          <aside className="mf-sidebar">
            {sidebarHeader ?? (
              <div className="mf-version">
                {sidebarLabel ?? "Documentation"} <span>{sidebarVersion}</span>
              </div>
            )}
            <nav aria-label="Documentation navigation">
              <ul>
                {pages.map((page) => (
                  <li key={page.path}>{link(page, page.label)}</li>
                ))}
              </ul>
            </nav>
            {sidebarFooter ? (
              <div className="mf-sidebar-footer">{sidebarFooter}</div>
            ) : null}
          </aside>
        )}
        <main ref={article} id="main" className="mf-article" tabIndex={-1}>
          <div className="mf-breadcrumb">
            {current?.source ?? "Documentation"} <span>/</span>{" "}
            {current?.label ?? "No page selected"}
          </div>
          {children}
          <footer className="mf-page-footer">
            {repository ? (
              <a
                href={contributeHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Contribute on GitHub ↗
              </a>
            ) : null}
            <div>
              {currentIndex > 0
                ? link(
                    pages[currentIndex - 1],
                    <>Previous page ← {pages[currentIndex - 1].label}</>,
                  )
                : null}
              {currentIndex >= 0 && currentIndex < pages.length - 1
                ? link(
                    pages[currentIndex + 1],
                    <>Next page → {pages[currentIndex + 1].label}</>,
                  )
                : null}
            </div>
          </footer>
        </main>
        {outline !== undefined ? (
          outline
        ) : (
          <aside className="mf-outline">
            {outlineHeader}
            {outlineFooter}
          </aside>
        )}
      </div>
    </div>
  );
}
