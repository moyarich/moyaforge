import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";

test("MDX Vite virtual modules have a packaged declaration-only entrypoint", async () => {
  const root = resolve(import.meta.dirname, "../../packages/moyaforge-mdx");
  const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const entry = pkg.exports["./virtual"];
  expect(Object.keys(entry)).toEqual(["types"]);
  expect(entry.types).toMatch(/^\.\/dist\/vite\/.*\.d\.ts$/);

  const declarations = await readFile(resolve(root, entry.types), "utf8");
  for (const id of [
    "registry",
    "lazy-registry",
    "metadata",
    "code-preview-components",
    "code-preview-sources",
  ]) {
    expect(declarations).toContain(`declare module "virtual:moyaforge-mdx/${id}"`);
  }
});
