import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tests/**/*.test.{js,jsx,ts,tsx}",
      "packages/*/tests/**/*.test.{js,jsx,ts,tsx}",
      "apps/*/tests/**/*.test.{js,jsx,ts,tsx}",
    ],
    environment: "node",
  },
});
