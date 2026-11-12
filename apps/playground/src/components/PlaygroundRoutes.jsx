import { Navigate, useLocation } from "react-router-dom";
import { RegistryRoutes } from "@moyarich/moyaforge/registry-routes";
import { Loading } from "./Shell/Loading.jsx";
import { PlaygroundShell } from "./Shell/PlaygroundShell.jsx";

export function PlaygroundRoutes() {
  const { pathname } = useLocation();
  if (pathname === "/") return <Navigate to="/docs" replace />;
  return (
    <RegistryRoutes
      fallback={<Loading label="Loading documentation…" />}
      notFound={
        <PlaygroundShell>
          <h1>Page not found</h1>
        </PlaygroundShell>
      }
      renderPage={(page, content) => (
        <PlaygroundShell page={page}>{content}</PlaygroundShell>
      )}
    />
  );
}
