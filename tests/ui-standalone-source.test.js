import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";

test.each([
  ["demo", "Demo"],
  ["page", "Page"],
  ["search", "Search"],
  ["source", "Source"],
  ["table-of-contents", "TableOfContents"],
])("%s is installed from private UI source", async (name, dir) => {
  const registry = JSON.parse(
    await readFile(new URL("../registry.json", import.meta.url), "utf8"),
  );
  const item = registry.items.find((entry) => entry.name === name);
  expect(item).toBeDefined();
  const files = item.files.filter((entry) =>
    entry.path.startsWith(`packages/moyaforge-ui/src/components/${dir}/`),
  );
  expect(files).toHaveLength(3);
  expect(files.some((entry) => entry.path.endsWith(".css"))).toBe(true);
});
