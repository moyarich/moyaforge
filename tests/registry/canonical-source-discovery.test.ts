import { test, expect } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fixture } from "../fixture/registry-generator.js";
import { buildRegistry } from "../../scripts/build-registry.mjs";

test("ignores framework-source UI and discovers only the canonical UI workspace", async () => {
  const { root, put } = await fixture();
  await put(
    "packages/moyaforge/src/components/Forbidden/index.ts",
    "export const Forbidden = true;",
  );
  const registry = await buildRegistry(root);
  expect(registry.items.some((item) => item.name === "forbidden")).toBe(false);
  expect(registry.items.some((item) => item.name === "new-badge")).toBe(true);
});
