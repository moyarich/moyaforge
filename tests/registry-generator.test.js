import { afterEach, expect, test } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { buildRegistry } from "../scripts/build-registry.mjs";
const roots = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), "registry-discovery-"));
  roots.push(root);
  async function put(path, content) {
    const target = resolve(root, path);
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, content);
  }
  await put(
    "packages/moyaforge/package.json",
    JSON.stringify({
      peerDependencies: { react: ">=18", "@example/icons": "^1.0.0" },
    }),
  );
  await mkdir(resolve(root, "registry/templates"), { recursive: true });
  await put(
    "packages/moyaforge/src/components/Nested/NewBadge/index.ts",
    'export * from "./NewBadge.js";',
  );
  await put(
    "packages/moyaforge/src/components/Nested/NewBadge/NewBadge.tsx",
    'import {createElement} from "react"; import type {Icon} from "@example/icons/types"; export const NewBadge = () => createElement("span"); export const load = () => import("../../../utils/lazy.js");',
  );
  await put(
    "packages/moyaforge/src/components/Nested/NewBadge/badge.css",
    '@import "./tokens.css";',
  );
  await put(
    "packages/moyaforge/src/components/Nested/NewBadge/tokens.css",
    "span { color: red; }",
  );
  await put(
    "packages/moyaforge/src/utils/lazy.ts",
    "export const loaded = true;",
  );
  return { root, put };
}
test("discovers unknown nested components, complete imports, styles and declared npm ranges deterministically", async () => {
  const { root, put } = await fixture();
  await put(
    "registry/templates/new-shell.tsx",
    'export {NewBadge} from "./components/Nested/NewBadge/index.js";',
  );
  await put(
    "packages/moyaforge/src/components/Unstyled/index.ts",
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
    "styles are stale",
  );
  await buildRegistry(root);
  await expect(
    readFile(resolve(root, "registry/styles/obsolete.css")),
  ).rejects.toThrow();
  await rm(resolve(root, "packages/moyaforge/src/components/Nested"), {
    recursive: true,
  });
  await rm(resolve(root, "registry/templates/new-shell.tsx"));
  await expect(buildRegistry(root, { check: true })).rejects.toThrow(
    "Registry is stale",
  );
  await rm(resolve(root, "packages/moyaforge/src/components/Unstyled"), {
    recursive: true,
  });
  expect((await buildRegistry(root)).items).toEqual([]);
  await expect(
    readFile(resolve(root, "registry/styles/new-badge.css")),
  ).rejects.toThrow();
});
test("rejects naming collisions, missing imports, undeclared packages and boundary escapes before writing", async () => {
  const { root, put } = await fixture();
  await put("registry/templates/new-badge.tsx", "export const Example = 1;");
  await expect(buildRegistry(root)).rejects.toThrow("Duplicate registry name");
  await rm(resolve(root, "registry/templates/new-badge.tsx"));
  const entry = "packages/moyaforge/src/components/Nested/NewBadge/index.ts";
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

test("failed regeneration preserves previously generated registry and styles", async () => {
  const { root, put } = await fixture();
  await buildRegistry(root);
  const manifest = await readFile(resolve(root, "registry.json"), "utf8");
  const styles = await readFile(
    resolve(root, "registry/styles/new-badge.css"),
    "utf8",
  );
  await put(
    "packages/moyaforge/src/components/Nested/NewBadge/index.ts",
    'export * from "./does-not-exist.js";',
  );
  await expect(buildRegistry(root)).rejects.toThrow(
    "Unresolved registry import",
  );
  expect(await readFile(resolve(root, "registry.json"), "utf8")).toBe(
    manifest,
  );
  expect(
    await readFile(resolve(root, "registry/styles/new-badge.css"), "utf8"),
  ).toBe(styles);
});

test("a no-change build preserves generated output byte-for-byte", async () => {
  const { root } = await fixture();
  await buildRegistry(root);
  const manifestPath = resolve(root, "registry.json");
  const cssPath = resolve(root, "registry/styles/new-badge.css");
  const before = await Promise.all([
    readFile(manifestPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);
  await buildRegistry(root);
  await buildRegistry(root, { check: true });
  expect(await readFile(manifestPath, "utf8")).toBe(before[0]);
  expect(await readFile(cssPath, "utf8")).toBe(before[1]);
});
