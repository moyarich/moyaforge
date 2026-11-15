import { HashRouter, Navigate, useLocation } from "react-router-dom";
import { RegistryRoutes } from "@moyarich/moyaforge/registry-routes";
import { Loading } from "./Loading.js";
import { PlaygroundShell } from "./PlaygroundShell.js";
import { PlaygroundMdxProvider } from "./mdx-provider.js";

function Pages() {
  const { pathname } = useLocation();
  if (pathname === "/") return <Navigate to="/docs" replace />;
  return (
    <RegistryRoutes
      fallback={<Loading label="Loading documentation…" />}
      notFound={<PlaygroundShell><h1>Page not found</h1></PlaygroundShell>}
      renderPage={(page, content) => (
        <PlaygroundShell page={page}>{content}</PlaygroundShell>
      )}
    />
  );
}

export function App() {
  return (
    <PlaygroundMdxProvider>
      <HashRouter><Pages /></HashRouter>
    </PlaygroundMdxProvider>
  );
}
