import { lazy, Suspense, useState, type ComponentType, type LazyExoticComponent } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import { BookOpen, Camera, Check } from "lucide-react";
import { MoyaForgeRouter, useContentRouting } from "__DOCS_IMPORT__";
/* __SHELL_IMPORTS__ */
/* __CODE_IMPORTS__ */
/* __SEARCH_IMPORT__ */
import { routes } from "virtual:moyaforge-mdx/metadata";
import { sources } from "virtual:moyaforge-mdx/lazy-registry";
import registry from "../registry.config";
const components = { pre: CodeBlock, CodeGroup, CodeTab, BookOpen, Camera, Check };
const loaded = new Map<string, LazyExoticComponent<ComponentType>>();
function ContentPage() {
  const { page } = useContentRouting();
  if (!page) return <><h1>Page not found</h1><Link to="/docs">Documentation</Link></>;
  const loader = sources[page.source]?.lazyPages?.[page.file];
  if (!loader) return <p>Content is unavailable.</p>;
  if (!loaded.has(page.path)) loaded.set(page.path, lazy(loader));
  const Page = loaded.get(page.path)!;
  return <Suspense fallback={<p role="status">Loading page…</p>}><Page /></Suspense>;
}
function Site() {
  const [count, setCount] = useState(0);
  return <Routes>
    /* __HYBRID_ROUTE__ */
    <Route path="*" element={<DocsShell title="My documentation" sources={registry.sources} __SEARCH_PROP__>
      /* __HYBRID_NAV__ */
      <ContentPage />
    </DocsShell>} />
  </Routes>;
}
export function App() {
  return <MDXProvider components={components}><MoyaForgeRouter pages={routes} mode="hash"><Site /></MoyaForgeRouter></MDXProvider>;
}
