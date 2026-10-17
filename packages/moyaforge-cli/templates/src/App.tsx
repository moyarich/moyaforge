import { lazy, Suspense, useState, type ComponentType, type LazyExoticComponent } from "react";
import { HashRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import { BookOpen, Camera, Check } from "lucide-react";
/* __SHELL_IMPORTS__ */
/* __CODE_IMPORTS__ */
/* __SEARCH_IMPORT__ */
import { routes } from "virtual:moyaforge-mdx/metadata";
import { sources } from "virtual:moyaforge-mdx/lazy-registry";
const components = { pre: CodeBlock, CodeGroup, CodeTab, BookOpen, Camera, Check };
const loaded = new Map<string, LazyExoticComponent<ComponentType>>();
const pages = routes.map(page => ({
  url: page.path,
  title: page.title,
}));
function ContentPage() {
  const { pathname } = useLocation();
  const currentPath = pathname.replace(/\\/+$/, "") || "/";
  const page = routes.find(entry => entry.path === currentPath);
  if (!page) return <><h1>Page not found</h1><Link to="/docs">Documentation</Link></>;
  const loader = sources[page.source]?.lazyPages?.[page.file];
  if (!loader) return <p>Content is unavailable.</p>;
  if (!loaded.has(page.path)) loaded.set(page.path, lazy(loader));
  const Page = loaded.get(page.path)!;
  return <Suspense fallback={<p role="status">Loading page…</p>}><Page /></Suspense>;
}
/* __SEARCH_COMPONENT__ */
function Site() {
  const [count, setCount] = useState(0);
  const { pathname } = useLocation();
  const sidebar = <aside className="mf-sidebar">\n    /* __SEARCH_UI__ */<nav aria-label="Documentation navigation">
    <Link className="mf-guide-link" to="/docs/guide">Guide</Link>
    <ul>{pages.map(page => <li key={page.url}><Link to={page.url}>{page.title}</Link></li>)}</ul>
  </nav></aside>;
  return <Routes>
    /* __HYBRID_ROUTE__ */
    <Route path="*" element={<DocsShell title="My documentation" pages={pages} currentUrl={pathname} sidebar={sidebar}>
      /* __HYBRID_NAV__ */
      <ContentPage />
    </DocsShell>} />
  </Routes>;
}
export function App() {
  return <MDXProvider components={components}><HashRouter><Site /></HashRouter></MDXProvider>;
}
