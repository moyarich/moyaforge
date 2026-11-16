import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { monacoReactTypesPlugin } from "@moyarich/moyaforge-monaco/vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root,
  plugins: [monacoReactTypesPlugin(fileURLToPath(new URL("../../", import.meta.url))), react()],
  worker: { format: "es" },
  build: {
    outDir: fileURLToPath(new URL("../../.consumer-dist", import.meta.url)),
    emptyOutDir: true,
  },
});
