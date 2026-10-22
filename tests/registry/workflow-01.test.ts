import { expect, test } from "vitest";
import { readFile } from "node:fs/promises";

const workflow = await readFile(
  new URL(
    "../../.github/workflows/build-component-registry.yml",
    import.meta.url,
  ),
  "utf8",
);

test("component registry supports manual and main-branch generation", () => {
  expect(workflow).toContain("workflow_dispatch:");
  expect(workflow).toMatch(/push:\s*\n\s*branches:\s*\[main\]/);
  expect(workflow).toContain('"packages/moyaforge/package.json"');
  expect(workflow).toContain('"scripts/build-registry.mjs"');
});
