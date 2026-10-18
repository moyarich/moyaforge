import { defineConfig, devices } from "@playwright/test";

/** Run CLI installation and packed-consumer browser smoke tests on main. */
export default defineConfig({
  testDir: "./packages/moyaforge-cli/tests/browser",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
