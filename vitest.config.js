import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/*/*.vitest.test.{js,jsx,ts,tsx}"],
    environment: "node",
  },
});
