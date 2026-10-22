import { defineConfig } from "vitest/config";

/** CSS has no runtime semantics in Node tests; Vite handles it in browser builds. */
const componentCssForNodeTests = {
  name: "moyaforge-test-component-css",
  enforce: "pre",
  resolveId(source, importer) {
    if (
      source.endsWith(".css") &&
      importer?.includes("/packages/moyaforge/dist/components/")
    ) {
      return "\0moyaforge-test-component-css";
    }
  },
  load(id) {
    if (id === "\0moyaforge-test-component-css") return "export default {};";
  },
};

export default defineConfig({
  plugins: [componentCssForNodeTests],
  test: {
    // Workspace tests run through their own npm test scripts and Vitest configs.
    include: ["tests/**/*.test.{js,jsx,mjs,ts,tsx}"],
    environment: "node",
  },
});
