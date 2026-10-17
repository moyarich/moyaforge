import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";

test("published framework exports contain no legacy UI entry points", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  expect(Object.keys(manifest.exports).sort()).toEqual([
    ".",
    "./headless",
    "./registry-routes",
  ]);
  for (const entry of Object.values(manifest.exports)) {
    expect(entry.import).toMatch(/^\.\/dist\/.*\.js$/);
    expect(entry.types).toMatch(/^\.\/dist\/.*\.d\.ts$/);
  }
});

test("headless MDX registry composition works without bundled UI", async () => {
  const { defineMdxComponentRegistry } = await import("../dist/headless.js");
  const A = () => null;
  const B = () => null;
  const original = { Callout: A };
  const result = defineMdxComponentRegistry(original, { Callout: B });
  expect(result.Callout).toBe(B);
  expect(original.Callout).toBe(A);
});
