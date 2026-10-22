import { test, expect } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fixture } from "../fixture/registry-generator.js";
import { buildRegistry } from "../../scripts/build-registry.mjs";

test("rejects naming collisions, missing imports, undeclared packages and boundary escapes before writing", async () => {
  const { root, put } = await fixture();
  await put("registry/templates/new-badge.tsx", "export const Example = 1;");
  await expect(buildRegistry(root)).rejects.toThrow("Duplicate registry name");
  await rm(resolve(root, "registry/templates/new-badge.tsx"));
  const entry = "packages/moyaforge-ui/src/components/Nested/NewBadge/index.ts";
  await put(entry, 'export * from "./missing.js";');
  await expect(buildRegistry(root)).rejects.toThrow(
    "Unresolved registry import",
  );
  await put(entry, 'import "unknown-package";');
  await expect(buildRegistry(root)).rejects.toThrow(
    "Undeclared registry dependency",
  );
  await put("outside.ts", "export const x = 1;");
  await put(entry, 'export * from "../../../../../../outside.ts";');
  await expect(buildRegistry(root)).rejects.toThrow(
    "outside canonical UI source",
  );
  await expect(readFile(resolve(root, "registry.json"))).rejects.toThrow();
});
