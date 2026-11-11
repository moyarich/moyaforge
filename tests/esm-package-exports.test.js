import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";

const publishablePackages = [
  "moyaforge",
  "moyaforge-cli",
  "moyaforge-mdx",
  "moyaforge-search-sqlite",
];

test.each(publishablePackages)("%s publishes modern ESM entrypoints", async (name) => {
  const manifest = JSON.parse(
    await readFile(
      new URL(`../packages/${name}/package.json`, import.meta.url),
      "utf8",
    ),
  );

  expect(manifest.type).toBe("module");
  expect(manifest.engines.node).toBe(">=22.12.0");

  const exports = Object.values(manifest.exports);
  expect(exports.length).toBeGreaterThan(0);
  for (const entry of exports) {
    expect(entry.types).toMatch(/^\.\/.*\.d\.ts$/);
    expect(entry.import).toMatch(/^\.\/.*\.js$/);
    expect(entry.default).toBe(entry.import);
    expect(entry).not.toHaveProperty("require");
  }

  expect(manifest.main).toBe(manifest.exports["."].import);
  expect(manifest.types).toBe(manifest.exports["."].types);
});
