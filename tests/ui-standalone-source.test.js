import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";

test.each([
  ["demo", "Demo"],
  ["page", "Page"],
  ["search", "Search"],
  ["source", "Source"],
  ["table-of-contents", "TableOfContents"],
])("%s is installed from UI source", async (name, dir) => {
  const registry = JSON.parse(
    await readFile(new URL("../registry.json", import.meta.url), "utf8"),
  );
  const item = registry.items.find((entry) => entry.name === name);
  expect(item).toBeDefined();
  const files = item.files.filter((entry) =>
    entry.path.startsWith(`packages/moyaforge-ui/src/components/${dir}/`),
  );
  const expected = ["index.ts", `${dir}.tsx`, `${dir}.css`];
  if (name === "search") {
    expected.push("DocumentationSearch.tsx", "DocumentationSearch.css");
    expect(item.dependencies).toEqual(
      expect.arrayContaining(["is-hotkey@^0.2.1", "@types/is-hotkey@^0.1.10"]),
    );
  }
  expect(files.map((entry) => entry.path.split("/").at(-1)).sort()).toEqual(
    expected.sort(),
  );
});
