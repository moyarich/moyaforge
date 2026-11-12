import { test, expect } from "vitest";
import { readFile, stat, utimes } from "node:fs/promises";
import { resolve } from "node:path";
import { fixture } from "../fixture/registry-generator.js";
import { buildRegistry } from "../../scripts/build-registry/build-registry.ts";

test("a no-change build preserves the registry and component CSS byte-for-byte", async () => {
  const { root } = await fixture();
  await buildRegistry(root);
  const manifestPath = resolve(root, "registry.json");
  const cssPath = resolve(
    root,
    "packages/moyaforge-ui/src/components/Nested/NewBadge/badge.css",
  );
  const fixedTime = new Date("2020-01-01T00:00:00Z");
  await utimes(manifestPath, fixedTime, fixedTime);
  const before = await Promise.all([
    readFile(manifestPath, "utf8"),
    readFile(cssPath, "utf8"),
    stat(manifestPath),
  ]);
  await buildRegistry(root);
  await buildRegistry(root, { check: true });
  expect(await readFile(manifestPath, "utf8")).toBe(before[0]);
  expect(await readFile(cssPath, "utf8")).toBe(before[1]);
  expect((await stat(manifestPath)).mtimeMs).toBe(before[2].mtimeMs);
});
