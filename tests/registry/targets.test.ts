import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";

test("every registry target uses the canonical component or shared utility location", async () => {
  const registry = JSON.parse(await readFile(new URL("../../registry.json", import.meta.url), "utf8"));
  expect(registry.items.length).toBeGreaterThan(0);
  for (const item of registry.items) {
    expect(item.files.length, item.name).toBeGreaterThan(0);
    for (const file of item.files) {
      expect(file.target, item.name).toMatch(/^~\/src\/components\/(?:ui|utils)\//);
      expect(file.target, item.name).not.toContain("/ui/components/");
      expect(file.target, item.name).not.toContain("/moyaforge/");
      expect(file.target, item.name).not.toMatch(/(?:^|\/)\.\.(?:\/|$)/);
    }
  }
});
