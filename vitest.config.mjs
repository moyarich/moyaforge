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
    include: [
      "tests/**/*.test.{js,jsx,mjs,ts,tsx}",
      "packages/*/tests/**/*.test.{js,jsx,mjs,ts,tsx}",
      "apps/*/tests/**/*.test.{js,jsx,mjs,ts,tsx}",
    ],
    // Browser-backed consumer suites run on main, where Chromium is installed.
    exclude: process.env.MOYAFORGE_MAIN_ONLY_BROWSER === "true"
      ? ["**/packed-consumers.test.mjs", "**/shadcn-consumer.test.mjs"]
      : [],
    environment: "node",
  },
});
