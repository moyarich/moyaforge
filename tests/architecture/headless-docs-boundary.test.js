import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";

test("registry distributes UI shells without bundling headless framework routing", async () => {
  const registry = JSON.parse(
    await readFile(new URL("../../registry.json", import.meta.url), "utf8"),
  );
  expect(registry.items.some((entry) => entry.name === "docs-routes")).toBe(
    false,
  );
  for (const name of ["docs-shell", "docs-shell-focused", "docs-shell-wide"]) {
    const shell = registry.items.find((entry) => entry.name === name);
    expect(shell).toBeDefined();
    expect(
      shell.files.every(
        (file) => !file.path.startsWith("packages/moyaforge/src/"),
      ),
    ).toBe(true);
  }
});

