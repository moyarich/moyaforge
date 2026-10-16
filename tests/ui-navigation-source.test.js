import { expect, test } from "vitest";
import { readFile } from "node:fs/promises";
const registry = JSON.parse(await readFile(new URL("../registry.json", import.meta.url), "utf8"));
test.each([
  ["navigation-tree", "NavigationTree"],
  ["sidebar-v1", "SidebarV1"],
  ["sidebar-v2", "SidebarV2"],
])("%s includes its canonical source in private UI workspace", (name, folder) => {
  const item = registry.items.find((entry) => entry.name === name);
  expect(item).toBeDefined();
  const own = item.files.filter((entry) => entry.path.startsWith(`packages/moyaforge-ui/src/components/${folder}/`));
  expect(own.length).toBeGreaterThan(0);
  expect(own.some((entry) => entry.path.endsWith(".tsx"))).toBe(true);
});
