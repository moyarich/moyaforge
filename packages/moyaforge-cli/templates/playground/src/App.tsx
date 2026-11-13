import { HashRouter, Navigate, useLocation } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import { RegistryRoutes } from "@moyarich/moyaforge/registry-routes";
import { DocumentationLink } from "@moyarich/moyaforge/headless";
import { CodeBlock } from "__UI__/CodeBlock/index.js";
import { CodeGroup, CodeTab } from "__UI__/CodeGroup/index.js";
import { CustomBlock } from "__UI__/CustomBlock/index.js";
import { PlaygroundShell } from "./PlaygroundShell.js";

const components = {
  a: DocumentationLink,
  pre: CodeBlock,
  CodeBlock,
  CodeGroup,
  CodeTab,
  CustomBlock,
};

function Pages() {
  const { pathname } = useLocation();
  if (pathname === "/") return <Navigate to="/docs" replace />;
  return (
    <RegistryRoutes
      fallback={<p role="status">Loading documentation…</p>}
      notFound={<PlaygroundShell><h1>Page not found</h1></PlaygroundShell>}
      renderPage={(page, content) => (
        <PlaygroundShell page={page}>{content}</PlaygroundShell>
      )}
    />
  );
}

export function App() {
  return (
    <MDXProvider components={components}>
      <HashRouter><Pages /></HashRouter>
    </MDXProvider>
  );
}
