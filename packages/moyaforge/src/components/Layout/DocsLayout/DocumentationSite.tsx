import { DocOutlineShell } from "../../DocOutline/DocOutlineShell.js";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ContentIndexRedirect,
  useContentRouting,
} from "../../Routing/content-routing.js";
import { flattenNavigation } from "@moyarich/moyaforge-mdx/navigation";
import {
  buildDocumentationGroups,
  createContentLinkHandler,
  type DocumentationSources,
} from "./utils.js";
import { SidebarV1 } from "../../SidebarV1/SidebarV1.js";
import { DocOutline } from "../../DocOutline/DocOutline.js";

export interface DocumentationSiteProps {
  title: string;
  children: ReactNode;
  repository?: string;
  /** Complete sidebar slot; pass null to omit the sidebar. */
  sidebar?: ReactNode;
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  sidebarLabel?: string;
  sidebarVersion?: string;
  /** Complete outline slot. Undefined uses the article outline; null hides the region. */
  outline?: ReactNode;
  outlineHeader?: ReactNode;
  outlineFooter?: ReactNode;
  /** Source labels and ordering from the same registry used by the content plugins. */
  sources?: DocumentationSources;
  search?: (query: string) => Promise<string[]>;
}

/** Reusable documentation chrome; content and search providers are supplied by the app. */
export function DocumentationSite({
  title,
  children,
  repository,
  search,
  sources = {},
  sidebar,
  sidebarHeader,
  sidebarFooter,
  sidebarLabel,
  sidebarVersion,
  outline,
  outlineHeader,
  outlineFooter,
}: DocumentationSiteProps) {
  const { routes, page, searchResultPage, navigateContent } =
    useContentRouting();
  const location = useLocation();
  const followContentLink = createContentLinkHandler({
    routes,
    page,
    pathname: location.pathname,
    navigateContent,
  });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [location.pathname]);
  const [dark, setDark] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const article = useRef<HTMLElement>(null);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
      }
      if (event.key === "Escape") {
        setQuery("");
        input.current?.blur();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);
  useEffect(() => {
    let active = true;
    let request = 0;
    const update = () => {
      const current = ++request;
      setError("");
      if (!search || !query.trim()) {
        setResults([]);
        return;
      }
      search(query)
        .then((value) => {
          if (active && current === request) setResults(value);
        })
        .catch(() => {
          if (active && current === request)
            setError("Search is unavailable. Please try again.");
        });
    };
    update();
    window.addEventListener("moyaforge-search:updated", update);
    return () => {
      active = false;
      window.removeEventListener("moyaforge-search:updated", update);
    };
  }, [query, search]);
  const groups = buildDocumentationGroups(routes, sources);
  const visible = groups.flatMap((group) => flattenNavigation(group.nodes));
  const index = visible.findIndex((item) => item.path === page?.path);
  return (
    <div
      className={`mf-docs${dark ? " mf-docs-dark" : ""}`}
      onClick={followContentLink}
    >
      <ContentIndexRedirect />
      <a className="mf-skip" href="#main">
        Skip to content
      </a>
      <header className="mf-header">
        <Link className="mf-brand" to={visible[0]?.path ?? "/"}>
          <span className="mf-logo">
            m<span>✳</span>
          </span>
          {title}
        </Link>
        {search && (
          <div className="mf-search">
            <label>
              <span aria-hidden="true">⌕</span>
              <input
                ref={input}
                aria-label="Search documentation"
                placeholder="Search documentation…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
            {query.trim() && (
              <div className="mf-results" aria-live="polite">
                {error ||
                  (results.length
                    ? results.map((key) => {
                        const result = searchResultPage(key);
                        return result ? (
                          <Link
                            key={key}
                            to={result.path}
                            onClick={() => setQuery("")}
                          >
                            {result.title}
                            <span>↗</span>
                          </Link>
                        ) : null;
                      })
                    : "No matching pages")}
              </div>
            )}
          </div>
        )}
        <nav aria-label="Main navigation">
          <Link to={visible[0]?.path ?? "/"} className="mf-guide-link">
            Guide
          </Link>
          {repository && <a href={repository}>GitHub ↗</a>}
          <button onClick={() => setDark(!dark)} aria-label="Toggle appearance">
            {dark ? "☀" : "☾"}
          </button>
          <button
            className="mf-menu"
            onClick={() => setMenu(!menu)}
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
          <SidebarV1
            header={sidebarHeader}
            footer={sidebarFooter}
            label={sidebarLabel}
            version={sidebarVersion}
            groups={groups}
            open={menu}
            onNavigate={() => setMenu(false)}
          />
        )}
        <main ref={article} id="main" className="mf-article" tabIndex={-1}>
          <div className="mf-breadcrumb">
            {groups.find((group) => group.source === page?.source)?.label ??
              "Documentation"}{" "}
            <span>/</span> {page?.label ?? "No page selected"}
          </div>
          {children}
          {page && (
            <footer className="mf-page-footer">
              {repository && <a href={repository}>Contribute on GitHub ↗</a>}
              <div>
                {index > 0 && (
                  <Link to={visible[index - 1].path}>
                    <small>Previous page</small>← {visible[index - 1].label}
                  </Link>
                )}
                {index >= 0 && index < visible.length - 1 && (
                  <Link to={visible[index + 1].path}>
                    <small>Next page</small>
                    {visible[index + 1].label} →
                  </Link>
                )}
              </div>
            </footer>
          )}
        </main>
        {outline !== undefined ? (
          outline
        ) : (
          <DocOutlineShell header={outlineHeader} footer={outlineFooter}>
            <DocOutline
              key={page?.path}
              rootRef={article}
              title="On this page"
            />
          </DocOutlineShell>
        )}
      </div>
    </div>
  );
}
