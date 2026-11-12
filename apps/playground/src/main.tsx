import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@moyarich/console/styles.css";
import "./styles.css";
import { PlaygroundMdxProvider } from "./mdx-provider.tsx";
import { App } from "./App.tsx";
import { routes } from "virtual:moyaforge-mdx/metadata";

import "./utils/vite-preload-error.ts";

// Lazy-page failures that persist after a refresh are handled by RegistryRouteView.
const root = document.getElementById("root");
if (!root) throw new Error("Playground root element not found");
createRoot(root).render(
  <React.StrictMode>
    <PlaygroundMdxProvider routes={routes}>
      <App />
    </PlaygroundMdxProvider>
  </React.StrictMode>,
);
