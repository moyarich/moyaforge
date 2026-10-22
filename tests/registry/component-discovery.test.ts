import { test, expect } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fixture } from "../fixture/registry-generator.js";
import { buildRegistry } from "../../scripts/build-registry.mjs";

test("discovers unknown nested components, complete imports, styles and declared npm ranges deterministically", async () => {
  const { root, put } = await fixture();
  await put("registry/templates/new-shell.tsx", "export const NewShell = 1;");
  await put(
    "packages/moyaforge-ui/src/components/Unstyled/index.ts",
    "export const Unstyled = 1;",
  );
  const registry = await buildRegistry(root);
  expect(registry.items.map((item) => item.name)).toEqual([
    "new-badge",
    "new-shell",
    "unstyled",
  ]);
  expect(registry.items[0].dependencies).toEqual([
    "@example/icons@^1.0.0",
    "react@>=18",
  ]);
  expect(
    registry.items[0].files.some((file) => file.path.endsWith("utils/lazy.ts")),
  ).toBe(true);
  const output = await readFile(resolve(root, "registry.json"), "utf8");
  await buildRegistry(root);
  expect(await readFile(resolve(root, "registry.json"), "utf8")).toBe(output);
  await buildRegistry(root, { check: true });
  await put("registry/styles/obsolete.css", "stale");
  await expect(buildRegistry(root, { check: true })).rejects.toThrow(
    "Obsolete registry/styles output",
  );
  await buildRegistry(root);
  await expect(
    readFile(resolve(root, "registry/styles/obsolete.css")),
  ).rejects.toThrow();
  await rm(resolve(root, "packages/moyaforge-ui/src/components/Nested"), {
    recursive: true,
  });
  await rm(resolve(root, "registry/templates/new-shell.tsx"));
  await expect(buildRegistry(root, { check: true })).rejects.toThrow(
    "Registry is stale",
  );
  await rm(resolve(root, "packages/moyaforge-ui/src/components/Unstyled"), {
    recursive: true,
  });
  expect((await buildRegistry(root)).items).toEqual([]);
  await expect(
    readFile(
      resolve(
        root,
        "packages/moyaforge-ui/src/components/Nested/NewBadge/badge.css",
      ),
    ),
  ).rejects.toThrow();
});
