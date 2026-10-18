import { defineConfig, devices } from "@playwright/test";

/** Run CLI installation and packed-consumer browser smoke tests on main. */
export default defineConfig({
  testDir: "./packages/moyaforge-cli/tests/browser",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  globalTimeout: process.env.CI ? 45 * 60_000 : undefined,
  outputDir: "test-results/cli",
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
