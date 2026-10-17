import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@moyarich/console/styles.css";
import "./styles.css";
import { PlaygroundMdxProvider } from "./mdx-provider.jsx";
import { App } from "./App.jsx";

const root = document.getElementById("root");
if (!root) throw new Error("Playground root element not found");
createRoot(root).render(
  <React.StrictMode>
    <PlaygroundMdxProvider>
      <App />
    </PlaygroundMdxProvider>
  </React.StrictMode>,
);
