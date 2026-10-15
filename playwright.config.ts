import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/vite-consumer-build",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:4179", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm exec --workspace @moyarich/moyaforge-playground -- vite --config ../../tests/vite-consumer-build/vite.config.js --host 127.0.0.1 --port 4179 --strictPort",
    url: "http://127.0.0.1:4179",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
