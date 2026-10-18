import { defineConfig } from "vitest/config";

/** Dedicated browser consumer suites; invoked from main CI after Chromium installation. */
export default defineConfig({
  test: {
    include: [
      "packages/moyaforge-cli/tests/packed-consumers.test.mjs",
      "packages/moyaforge-cli/tests/shadcn-consumer.test.mjs",
    ],
    environment: "node",
    maxWorkers: 1,
  },
});
