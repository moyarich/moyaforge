import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/playground-navigation",
  testMatch: "**/*.spec.ts",
  forbidOnly: Boolean(process.env.CI),
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4180",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "npm run build:playground && npm exec --workspace @moyarich/moyaforge-playground -- vite preview --host 127.0.0.1 --port 4180 --strictPort",
    url: "http://127.0.0.1:4180",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
