import "./DocumentationSite.css";
import { PanelLeft } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../ResizablePanel/index.js";
import { DocumentationSearch } from "../../Search/DocumentationSearch.js";
import { SidebarScrollArea } from "../../SidebarV1/SidebarScrollArea.js";
import { useId, useState, type ReactNode } from "react";
import type {
  DocumentationSitePage,
  DocumentationSiteProps,
} from "./DocumentationSite.types.js";
import {
  getDocumentationNavigation,
  getRepositoryEditUrl,
} from "./documentation-site-utils.js";
import { useMobileNavigation } from "./use-mobile-navigation.js";

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
  breadcrumbs,
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
  const layoutId = useId();
  const { menu, setMenu, menuButton, closeMenu, closeAfterNavigation } =
    useMobileNavigation(currentPath);
  const [dark, setDark] = useState(false);
  const {
    visiblePages,
    current,
    previous,
    next,
    breadcrumbs: defaultBreadcrumbs,
  } = getDocumentationNavigation(pages, currentPath);
  const breadcrumbItems = breadcrumbs ?? defaultBreadcrumbs;
  const contributeHref = getRepositoryEditUrl(
    repository,
    repositoryBranch,
    current?.sourcePath,
  );
  const navigate = (path: string) => {
    setMenu(false);
    onNavigate?.(path);
  };
  const link = (
    page: Pick<DocumentationSitePage, "path">,
    children: ReactNode,
  ) => (
    <a
      href={page.path}
      aria-current={page.path === currentPath ? "page" : undefined}
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
  const sidebarContent =
    sidebar !== undefined ? (
      sidebar
    ) : (
      <aside className="mf-sidebar mf-sidebar-panel">
        {sidebarHeader ?? (
          <div className="mf-version">
            {sidebarLabel ?? "Documentation"} <span>{sidebarVersion}</span>
          </div>
        )}
        <SidebarScrollArea>
          <nav aria-label="Documentation navigation">
            <ul>
              {visiblePages.map((page) => (
                <li key={page.path}>{link(page, page.title)}</li>
              ))}
            </ul>
          </nav>
        </SidebarScrollArea>
        {sidebarFooter != null && (
          <div className="mf-sidebar-footer">{sidebarFooter}</div>
        )}
      </aside>
    );
  return (
    <div className={`mf-docs${dark ? " mf-docs-dark" : ""}`}>
      <a className="mf-skip" href="#main">
        Skip to content
      </a>
      <header className="mf-header" inert={menu}>
        <button
          type="button"
          ref={menuButton}
          className="mf-menu"
          onClick={() => setMenu((value) => !value)}
          aria-expanded={menu}
          aria-label={menu ? "Close navigation" : "Open navigation"}
          title={menu ? "Close navigation" : "Open navigation"}
        >
          <PanelLeft aria-hidden="true" focusable="false" />
        </button>
        <div className="mf-brand">
          {visiblePages[0] ? link(visiblePages[0], title) : title}
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
          {visiblePages[0] ? link(visiblePages[0], "Guide") : null}
          {repository ? <a href={repository}>GitHub ↗</a> : null}
          <button
            type="button"
            onClick={() => setDark((value) => !value)}
            aria-label="Toggle appearance"
          >
            {dark ? "☀" : "☾"}
          </button>
        </nav>
      </header>
      {menu && (
        <button
          type="button"
          className="mf-sidebar-backdrop"
          aria-label="Close navigation"
          tabIndex={-1}
          onClick={() => {
            setMenu(false);
            menuButton.current?.focus();
          }}
        />
      )}
      {sidebar !== null && (
        <ResizablePanelGroup className="mf-mobile-navigation" hidden={!menu}>
          <ResizablePanel
            defaultSize={80}
            minSize={40}
            maxSize={95}
            className="mf-mobile-sidebar-panel"
            onClickCapture={closeAfterNavigation}
          >
            <div className="mf-mobile-navigation-header">
              <span className="mf-brand">{title}</span>
              <button
                type="button"
                className="mf-menu"
                onClick={closeMenu}
                aria-label="Close navigation"
                title="Close navigation"
                aria-expanded={menu}
              >
                <PanelLeft aria-hidden="true" focusable="false" />
              </button>
            </div>
            {sidebarContent}
          </ResizablePanel>
          <ResizableHandle
            aria-label="Resize mobile navigation"
            className="mf-mobile-sidebar-handle"
          />
          <ResizablePanel
            defaultSize={20}
            minSize={5}
            className="mf-mobile-dismiss-panel"
          >
            <button
              type="button"
              aria-label="Close navigation"
              tabIndex={-1}
              onClick={closeMenu}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
      <ResizablePanelGroup
        className={[
          "mf-docs-grid",
          "mf-docs-resizable",
          menu && "is-menu-open",
          sidebar === null && "mf-no-sidebar",
          outline === null && "mf-no-outline",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {sidebar !== null && (
          <>
            <ResizablePanel
              id={`${layoutId}-sidebar`}
              defaultSize={22}
              minSize={14}
              maxSize={40}
              className="mf-docs-sidebar-panel"
              onClickCapture={closeAfterNavigation}
            >
              {sidebarContent}
            </ResizablePanel>
            <ResizableHandle
              className="mf-docs-sidebar-handle"
              aria-label="Resize documentation sidebar"
            />
          </>
        )}
        <ResizablePanel
          id={`${layoutId}-content`}
          defaultSize={sidebar === null ? 100 : 78}
          minSize={60}
          className="mf-docs-content-panel"
          inert={menu}
        >
          <div className="mf-docs-content-grid">
            <main id="main" className="mf-article" tabIndex={-1}>
              {breadcrumbItems.length > 0 && (
                <nav className="mf-breadcrumb" aria-label="Breadcrumb">
                  <ol>
                    {breadcrumbItems.map((item, index) => (
                      <li key={item.path}>
                        {index > 0 && (
                          <span
                            className="mf-breadcrumb-separator"
                            aria-hidden="true"
                          >
                            /
                          </span>
                        )}
                        {index === breadcrumbItems.length - 1 ? (
                          <span aria-current="page">{item.title}</span>
                        ) : (
                          link(item, item.title)
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
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
                  {previous
                    ? link(previous, <>Previous page ← {previous.title}</>)
                    : null}
                  {next ? link(next, <>Next page → {next.title}</>) : null}
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
