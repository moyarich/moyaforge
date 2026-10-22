import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

test("all registry source files exist and omit documentation and licenses", async () => {
  const repository = resolve(import.meta.dirname, "../..");
  const registry = JSON.parse(
    await readFile(resolve(repository, "registry.json"), "utf8"),
  );
  for (const item of registry.items) {
    for (const file of item.files) {
      expect(file.path, item.name).not.toMatch(
        /(?:^|\/)(?:README\.md|LICENSE(?:\.[^/]*)?)$/i,
      );
      expect(file.path, item.name).not.toMatch(/(?:^|\/)\.\.(?:\/|$)/);
      await expect(
        readFile(resolve(repository, file.path), "utf8"),
      ).resolves.toBeTypeOf("string");
    }
  }
});
