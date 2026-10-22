import { test, expect } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fixture } from "./fixture.js";
import { buildRegistry } from "../../scripts/build-registry.mjs";

test("installs components directly under ui while preserving external relative imports", async () => {
  const { root } = await fixture();
  const registry = await buildRegistry(root);
  const badge = registry.items.find((item) => item.name === "new-badge");
  const installed = badge.files;
  expect(installed.some((file) => file.path === "LICENSE" || file.path.endsWith("README.md"))).toBe(false);
  expect(installed.find((file) => file.path.endsWith("NewBadge/index.ts")).target)
    .toBe("~/src/components/ui/Nested/NewBadge/index.ts");
  expect(installed.find((file) => file.path.endsWith("utils/lazy.ts")).target)
    .toBe("~/src/components/utils/lazy.ts");
  expect(installed.every((file) => !file.target.includes("/ui/components/"))).toBe(true);
  await buildRegistry(root, { check: true });
});
