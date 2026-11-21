import "./DocumentationSite.css";
import { PanelLeft } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../ResizablePanel/index.js";
import {
  DocumentationSearch,
  type DocumentationSearchProps,
} from "../../Search/DocumentationSearch.js";
import { SidebarScrollArea } from "../../SidebarV1/SidebarScrollArea.js";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

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
  const layoutId = useId();
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menu) return;
    const media = window.matchMedia("(max-width: 720px)");
    if (!media.matches) {
      setMenu(false);
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    const closeOnResize = () => {
      if (!media.matches) setMenu(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    media.addEventListener("change", closeOnResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      media.removeEventListener("change", closeOnResize);
    };
  }, [menu]);
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
              {pages.map((page) => (
                <li key={page.path}>{link(page, page.label)}</li>
              ))}
            </ul>
          </nav>
        </SidebarScrollArea>
        {sidebarFooter != null && (
          <div className="mf-sidebar-footer">{sidebarFooter}</div>
        )}
      </aside>
    );
  const closeMenu = () => {
    setMenu(false);
    menuButton.current?.focus();
  };
  const closeAfterNavigation = (
    event: import("react").MouseEvent<HTMLDivElement>,
  ) => {
    if ((event.target as Element).closest("a[href]")) setMenu(false);
  };
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
              onClickCapture={(event) => {
                if ((event.target as Element).closest("a[href]"))
                  setMenu(false);
              }}
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
