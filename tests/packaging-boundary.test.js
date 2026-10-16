import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cwd = path.dirname(fileURLToPath(import.meta.url));
const read = async (file) => JSON.parse(await readFile(path.resolve(cwd, file), "utf8"));

test("UI source workspace stays private and outside framework package exports", async () => {
  const ui = await read("../packages/moyaforge-ui/package.json");
  const pkg = await read("../packages/moyaforge/package.json");
  expect(ui.private).toBe(true);
  expect(Object.values(pkg.exports).join(" ")).not.toMatch(/moyaforge-ui/);
  expect({ ...pkg.dependencies, ...pkg.peerDependencies }).not.toHaveProperty("@moyarich/moyaforge-ui-source");
});

test("standalone MDX package has no framework or UI dependency", async () => {
  const pkg = await read("../packages/moyaforge-mdx/package.json");
  expect({ ...pkg.dependencies, ...pkg.peerDependencies }).not.toHaveProperty("@moyarich/moyaforge");
  expect({ ...pkg.dependencies, ...pkg.peerDependencies }).not.toHaveProperty("@moyarich/moyaforge-ui-source");
});
