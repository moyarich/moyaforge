import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";

const registry = JSON.parse(await readFile(new URL("../registry.json", import.meta.url), "utf8"));
test.each(["code-block", "code-group", "doc-outline"])("%s installs UI-owned component graph", (name) => {
  const item = registry.items.find((entry) => entry.name === name);
  expect(item).toBeDefined();
  const componentFiles = item.files.filter((file) => /\.(ts|tsx|css)$/.test(file.path) && file.path.startsWith("packages/"));
  expect(componentFiles.length).toBeGreaterThan(0);
  expect(componentFiles.every((file) => file.path.startsWith("packages/moyaforge-ui/src/components/"))).toBe(true);
});
