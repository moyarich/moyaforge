import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@moyarich/console/styles.css";
import "./styles.css";
import { PlaygroundMdxProvider } from "./mdx-provider.jsx";
import { App } from "./App.jsx";
import { routes } from "virtual:moyaforge-mdx/metadata";

const root = document.getElementById("root");
if (!root) throw new Error("Playground root element not found");
createRoot(root).render(
  <React.StrictMode>
    <PlaygroundMdxProvider routes={routes}>
      <App />
    </PlaygroundMdxProvider>
  </React.StrictMode>,
);
