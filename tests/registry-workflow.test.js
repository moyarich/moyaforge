import { expect, test } from "vitest";
import { readFile } from "node:fs/promises";

const workflow = await readFile(
  new URL("../.github/workflows/build-component-registry.yml", import.meta.url),
  "utf8",
);

test("component registry supports manual and main-branch generation", () => {
  expect(workflow).toContain("workflow_dispatch:");
  expect(workflow).toMatch(/push:\s*\n\s*branches:\s*\[main\]/);
  expect(workflow).toContain('"packages/moyaforge/package.json"');
  expect(workflow).toContain('"scripts/build-registry.mjs"');
});

test("registry bot changes only generated output after validation", () => {
  const build = workflow.indexOf("npm run registry:build");
  const check = workflow.indexOf("npm run registry:check");
  const validate = workflow.indexOf("shadcn@4.21.5 registry validate");
  const stage = workflow.indexOf("git add -- registry.json registry/styles");
  expect(build).toBeGreaterThan(-1);
  expect(check).toBeGreaterThan(build);
  expect(validate).toBeGreaterThan(check);
  expect(stage).toBeGreaterThan(validate);
  expect(workflow).toContain("git diff --cached --quiet");
  expect(workflow).toContain('git push origin "HEAD:${GITHUB_REF_NAME}"');
  expect(workflow).not.toMatch(/git push[^\n]*--force/);
});

test("registry automation serializes branch updates and uses the repo token", () => {
  expect(workflow).toMatch(/permissions:\s*\n\s*contents:\s*write/);
  expect(workflow).toContain(
    "group: build-component-registry-${{ github.ref }}",
  );
  expect(workflow).toContain("cancel-in-progress: false");
  expect(workflow).toContain("ref: ${{ github.ref_name }}");
  expect(workflow).not.toMatch(/secrets\.(?:PAT|_NPM_TOKEN)/);
});
