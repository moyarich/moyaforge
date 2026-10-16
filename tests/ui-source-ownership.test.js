import { expect, test } from "vitest";
import { readFile } from "node:fs/promises";

test("EmptyState installs from its independent UI source", async () => {
  const registry = JSON.parse(
    await readFile(new URL("../registry.json", import.meta.url), "utf8"),
  );
  const entry = registry.items.find((item) => item.name === "empty-state");
  expect(entry).toBeDefined();
  const componentFiles = entry.files.filter(
    (file) => file.path.endsWith(".tsx") || file.path.endsWith(".ts"),
  );
  expect(componentFiles.length).toBeGreaterThan(0);
  for (const file of componentFiles)
    expect(file.path).toMatch(
      /^packages\/moyaforge-ui\/src\/components\/EmptyState\//,
    );
});
