import { afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const roots = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
export async function fixture() {
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
