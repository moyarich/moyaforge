import { expect, test } from "vitest";
import { readFile } from "node:fs/promises";

const workflow = await readFile(
  new URL(
    "../../.github/workflows/build-component-registry.yml",
    import.meta.url,
  ),
  "utf8",
);

test("registry automation serializes branch updates and uses the repo token", () => {
  expect(workflow).toMatch(/permissions:\s*\n\s*contents:\s*write/);
  expect(workflow).toContain(
    "group: build-component-registry-${{ github.ref }}",
  );
  expect(workflow).toContain("cancel-in-progress: false");
  expect(workflow).toContain("ref: ${{ github.ref_name }}");
  expect(workflow).not.toMatch(/secrets\.(?:PAT|_NPM_TOKEN)/);
});
