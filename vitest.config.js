import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/vite-consumer-build/**/*.test.js"],
    environment: "node",
  },
});
