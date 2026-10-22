import { test, expect } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fixture } from "./fixture.js";
import { buildRegistry } from "../../scripts/build-registry.mjs";

test("failed regeneration preserves the registry and component-owned styles", async () => {
  const { root, put } = await fixture();
  await buildRegistry(root);
  const manifest = await readFile(resolve(root, "registry.json"), "utf8");
  const styles = await readFile(
    resolve(
      root,
      "packages/moyaforge-ui/src/components/Nested/NewBadge/badge.css",
    ),
    "utf8",
  );
  await put(
    "packages/moyaforge-ui/src/components/Nested/NewBadge/index.ts",
    'export * from "./does-not-exist.js";',
  );
  await expect(buildRegistry(root)).rejects.toThrow(
    "Unresolved registry import",
  );
  expect(await readFile(resolve(root, "registry.json"), "utf8")).toBe(manifest);
  expect(
    await readFile(
      resolve(
        root,
        "packages/moyaforge-ui/src/components/Nested/NewBadge/badge.css",
      ),
      "utf8",
    ),
  ).toBe(styles);
});
