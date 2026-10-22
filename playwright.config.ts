import { defineConfig, devices } from "@playwright/test";

/** One runner for independent Vite-consumer and CLI-consumer browser suites. */
export default defineConfig({
  testMatch: "**/*.spec.ts",
  forbidOnly: Boolean(process.env.CI),
  globalTimeout: process.env.CI ? 45 * 60_000 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  outputDir: "test-results",
  workers: 1,
  use: { trace: "on-first-retry" },
  projects: [
    {
      name: "vite-consumer",
      testDir: "./tests/vite-consumer-build",
      fullyParallel: true,
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:4179" },
    },
    {
      name: "cli-consumer",
      testDir: "./packages/moyaforge-cli/tests/browser",
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "npm exec --workspace @moyarich/moyaforge-playground -- vite --config ../../tests/vite-consumer-build/vite.config.ts --host 127.0.0.1 --port 4179 --strictPort",
    url: "http://127.0.0.1:4179",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
