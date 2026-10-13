import React from "react";
import { createRoot } from "react-dom/client";
import "@moyarich/moyaforge/components.css";
import "@moyarich/console/styles.css";
import "./styles.css";
import { App } from "./App.jsx";

const root = document.getElementById("root");
if (!root) throw new Error("Playground root element not found");
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
