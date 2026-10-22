import { test, expect } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fixture } from "../fixture/registry-generator.js";
import { buildRegistry } from "../../scripts/build-registry.mjs";

test("a no-change build preserves the registry and component CSS byte-for-byte", async () => {
  const { root } = await fixture();
  await buildRegistry(root);
  const manifestPath = resolve(root, "registry.json");
  const cssPath = resolve(
    root,
    "packages/moyaforge-ui/src/components/Nested/NewBadge/badge.css",
  );
  const before = await Promise.all([
    readFile(manifestPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);
  await buildRegistry(root);
  await buildRegistry(root, { check: true });
  expect(await readFile(manifestPath, "utf8")).toBe(before[0]);
  expect(await readFile(cssPath, "utf8")).toBe(before[1]);
});
