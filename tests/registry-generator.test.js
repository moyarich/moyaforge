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
  await mkdir(resolve(root, "packages/moyaforge/src/components"), {
    recursive: true,
  });
  await put(
    "packages/moyaforge-ui/src/components/Nested/NewBadge/index.ts",
    'export * from "./NewBadge.js";',
  );
  await put(
    "packages/moyaforge-ui/src/components/Nested/NewBadge/NewBadge.tsx",
    'import "./badge.css"; import {createElement} from "react"; import type {Icon} from "@example/icons/types"; export const NewBadge = () => createElement("span"); export const load = () => import("../../../utils/lazy.js");',
  );
  await put(
    "packages/moyaforge-ui/src/components/Nested/NewBadge/badge.css",
    '@import "./tokens.css";',
  );
  await put(
    "packages/moyaforge-ui/src/components/Nested/NewBadge/tokens.css",
    "span { color: red; }",
  );
  await put(
    "packages/moyaforge-ui/src/utils/lazy.ts",
    "export const loaded = true;",
  );
  return { root, put };
}
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

test("automatically includes component setup guides as standard registry docs and copied files", async () => {
  const { root, put } = await fixture();
  const guide =
    "## Setup\n\nInstall the host dependencies and configure workers.\n";
  await put(
    "packages/moyaforge-ui/src/components/Nested/NewBadge/README.md",
    guide,
  );
  const generated = await buildRegistry(root);
  const item = generated.items.find((item) => item.name === "new-badge");
  expect(item.docs).toBe(guide);
  expect(
    item.files.some(
      (file) =>
        file.target ===
        "~/src/components/ui/components/Nested/NewBadge/README.md",
    ),
  ).toBe(true);
  await buildRegistry(root, { check: true });
  await put(
    "packages/moyaforge-ui/src/components/Nested/NewBadge/README.md",
    "Changed setup requirements.\n",
  );
  await expect(buildRegistry(root, { check: true })).rejects.toThrow(
    "Registry is stale",
  );
});

test("styles follow component imports without collecting unused siblings or aggregate entries", async () => {
  const { root, put } = await fixture();
  await put(
    "packages/moyaforge-ui/src/components/Nested/NewBadge/unused.css",
    "body { color: red; }",
  );
  const { items } = await buildRegistry(root);
  const item = items.find((item) => item.name === "new-badge");
  expect(item.files.some((file) => file.path.endsWith("badge.css"))).toBe(true);
  expect(item.files.some((file) => file.path.endsWith("tokens.css"))).toBe(
    true,
  );
  expect(item.files.some((file) => file.path.endsWith("unused.css"))).toBe(
    false,
  );
  expect(
    item.files.some((file) => file.path.startsWith("registry/styles/")),
  ).toBe(false);
  await expect(
    readFile(resolve(root, "registry/styles/new-badge.css")),
  ).rejects.toThrow();
});

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

test("locates local CSS imports relative to each stylesheet using real at-rules", async () => {
  const { root, put } = await fixture();
  const folder = "packages/moyaforge-ui/src/components/Nested/NewBadge";
  await put(
    `${folder}/badge.css`,
    `
    /* @import "missing-comment.css"; */
    @import "tokens.css" layer(theme);
    @import url(./nested/layout.css?v=1) screen;
    @import url("./space name.css");
    @import "https://example.com/fonts.css";
    @import url(//example.com/theme.css);
    @import "/host-theme.css";
  `,
  );
  await put(`${folder}/nested/layout.css`, '@import "../tokens.css";');
  await put(`${folder}/space name.css`, ".demo { display: grid; }");
  const { items } = await buildRegistry(root);
  const paths = items
    .find((item) => item.name === "new-badge")
    .files.map((file) => file.path);
  expect(paths).toContain(`${folder}/tokens.css`);
  expect(paths).toContain(`${folder}/nested/layout.css`);
  expect(paths).toContain(`${folder}/space name.css`);
  expect(paths.filter((path) => path.endsWith("tokens.css"))).toHaveLength(1);
  expect(paths.some((path) => path.includes("missing-comment"))).toBe(false);
  await buildRegistry(root, { check: true });
  const previous = await readFile(resolve(root, "registry.json"), "utf8");
  await put(`${folder}/badge.css`, "@import url(missing.css);");
  await expect(buildRegistry(root)).rejects.toThrow(
    "Unresolved registry import",
  );
  expect(await readFile(resolve(root, "registry.json"), "utf8")).toBe(previous);
});
