import { defineConfig } from "vitest/config";

/** CLI unit/integration tests only; Playwright owns tests/browser/*.spec.ts. */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.{js,jsx,mjs,ts,tsx}"],
    exclude: ["tests/browser/**/*.spec.ts"],
    environment: "node",
  },
});
