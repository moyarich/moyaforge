import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../../packages/moyaforge-monaco");

test.each([
  "components/MonacoEditorCore/Monaco.css",
  "components/MonacoEditorCore/MonacoLoading.css",
])("Monaco publishes CSS imports and resolvable asset declarations: %s", async (path) => {
  const css = resolve(root, "dist", path);
  expect((await stat(css)).isFile()).toBe(true);
  expect((await readFile(css, "utf8")).length).toBeGreaterThan(0);
  const declaration = css.replace(/\.css$/, ".d.css.ts");
  expect(await readFile(declaration, "utf8")).toContain("export {}");
});

test("the public Monaco CSS aggregate is published", async () => {
  const path = resolve(root, "dist/styles.css");
  expect((await stat(path)).isFile()).toBe(true);
});
