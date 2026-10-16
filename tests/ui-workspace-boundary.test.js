import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";

const readPackage = async (relativePath) =>
  JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));

test("UI source workspace cannot be published to npm", async () => {
  const source = await readPackage("../packages/moyaforge-ui/package.json");
  expect(source.private).toBe(true);
  expect(source.version).toBe("0.0.0");
  expect(source.publishConfig).toBeUndefined();
});

test("framework does not depend on the private UI source workspace", async () => {
  const framework = await readPackage("../packages/moyaforge/package.json");
  const deps = {
    ...framework.dependencies,
    ...framework.peerDependencies,
    ...framework.optionalDependencies,
  };
  expect(deps).not.toHaveProperty("@moyarich/moyaforge-ui-source");
});
