import { test, expect } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fixture } from "./fixture.js";
import { buildRegistry } from "../../scripts/build-registry.mjs";

test("follows inline TypeScript import types for local files and npm dependencies", async () => {
  const { root, put } = await fixture();
  const entry = "packages/moyaforge-ui/src/components/Nested/NewBadge/index.ts";
  await put(entry, 'export type Badge = import("./types.js").Badge;');
  await put(
    "packages/moyaforge-ui/src/components/Nested/NewBadge/types.ts",
    'export type Badge = import("@example/icons/types").Icon;',
  );
  const registry = await buildRegistry(root);
  const item = registry.items.find((item) => item.name === "new-badge");
  expect(
    item.files.some((file) => file.path.endsWith("NewBadge/types.ts")),
  ).toBe(true);
  expect(item.dependencies).toEqual(["@example/icons@^1.0.0"]);
  const previous = await readFile(resolve(root, "registry.json"), "utf8");
  await put(entry, 'export type Badge = import("undeclared-package").Badge;');
  await expect(buildRegistry(root)).rejects.toThrow(
    "Undeclared registry dependency 'undeclared-package'",
  );
  expect(await readFile(resolve(root, "registry.json"), "utf8")).toBe(previous);
  await put(entry, 'export type Badge = import("./missing.js").Badge;');
  await expect(buildRegistry(root)).rejects.toThrow(
    "Unresolved registry import",
  );
});
