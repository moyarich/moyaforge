import { HashRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import { BookOpen, Camera, Check } from "lucide-react";
import { DocsShell } from "__UI__/docs-shell.js";
import { CodeBlock } from "__UI__/CodeBlock/CodeBlock.js";
import { CodeGroup, CodeTab } from "__UI__/CodeGroup/CodeGroup.js";
import { SearchPanel } from "./SearchPanel.js";
import { Playground } from "./Playground.js";
import { routes } from "virtual:moyaforge-mdx/metadata";
import { ContentPage, documentationLinkComponents } from "./Routing.js";

const components = { ...documentationLinkComponents, pre: CodeBlock, CodeGroup, CodeTab, BookOpen, Camera, Check };
const pages = routes.map(page => ({
  url: page.path,
  title: page.title,
}));

function Site() {
  const { pathname } = useLocation();
  const sidebar = <aside className="mf-sidebar">
    <SearchPanel /><nav aria-label="Documentation navigation">
    
    <ul>{pages.map(page => <li key={page.url}><Link className={page.url === "/docs/guide" ? "mf-guide-link" : undefined} to={page.url}>{page.title}</Link></li>)}</ul>
  </nav></aside>;
  return <Routes>
    {!routes.some((page) => page.path === "/") && (
      <Route path="/" element={<Navigate to="/docs" replace />} />
    )}
    {__PLAYGROUND_ENABLED__ && <Route path="/playground" element={<Playground />} />}
    <Route path="*" element={<DocsShell title="My documentation" pages={pages} currentUrl={pathname} sidebar={sidebar}>
      {__PLAYGROUND_ENABLED__ && <Link to="/playground">Interactive playground</Link>}
      <ContentPage />
    </DocsShell>} />
  </Routes>;
}
export function App() {
  return <MDXProvider components={components}><HashRouter><Site /></HashRouter></MDXProvider>;
}
