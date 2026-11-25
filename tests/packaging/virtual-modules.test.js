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
    "preview-code-components",
    "preview-code-sources",
  ]) {
    expect(declarations).toContain(`declare module "virtual:moyaforge-mdx/${id}"`);
  }
});

test("Monaco Vite virtual React types are namespaced and published", async () => {
  const root = resolve(import.meta.dirname, "../../packages/moyaforge-monaco");
  const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  expect(Object.keys(pkg.exports["./vite/react-types"])).toEqual(["types"]);
  expect(pkg.exports["./vite/react-types"].types).toBe("./dist/vite/react-types.d.ts");

  const declarations = await readFile(resolve(root, pkg.exports["./vite/react-types"].types), "utf8");
  expect(declarations).toContain('declare module "virtual:moyaforge-monaco/react-types"');
  expect(declarations).not.toContain("virtual:monaco-react-types");

  for (const path of ["src/vite/monacoReactTypesPlugin.ts", "src/workers/configureTypeScript.ts"]) {
    const source = await readFile(resolve(root, path), "utf8");
    expect(source).toContain("virtual:moyaforge-monaco/react-types");
    expect(source).not.toContain("virtual:monaco-react-types");
  }
});
