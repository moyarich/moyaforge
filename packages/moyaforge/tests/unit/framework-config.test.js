import { test, expect } from "vitest";
import {
  DEFAULT_MOYAFORGE_PATHS,
  defineMoyaForgeConfig,
} from "../../src/index.ts";

test("framework defaults are independent of repository layout", () => {
  expect(DEFAULT_MOYAFORGE_PATHS).toEqual({
    source: "src",
    docs: "docs",
    api: "api",
    output: "dist",
  });
  expect(Object.values(DEFAULT_MOYAFORGE_PATHS).join(" ")).not.toContain(
    "apps/playground",
  );
});

test("consumer overrides keep unrelated defaults", () => {
  expect(defineMoyaForgeConfig({
    mode: "docs",
    paths: { source: "frontend", output: "build" },
  })).toMatchObject({
    mode: "docs",
    paths: {
      source: "frontend",
      docs: "docs",
      api: "api",
      output: "build",
    },
  });
});
