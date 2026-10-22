import { expect, test } from "vitest";
import { readFile } from "node:fs/promises";

const workflow = await readFile(
  new URL("../../.github/workflows/build-component-registry.yml", import.meta.url),
  "utf8",
);

test("registry bot changes only generated output after validation", () => {
  const build = workflow.indexOf("npm run registry:build");
  const check = workflow.indexOf("npm run registry:check");
  const validate = workflow.indexOf("shadcn@4.21.5 registry validate");
  const stage = workflow.indexOf("git add -- registry.json");
  expect(build).toBeGreaterThan(-1);
  expect(check).toBeGreaterThan(build);
  expect(validate).toBeGreaterThan(check);
  expect(stage).toBeGreaterThan(validate);
  expect(workflow).toContain("git diff --cached --quiet");
  expect(workflow).toContain('git push origin "HEAD:${GITHUB_REF_NAME}"');
  expect(workflow).not.toMatch(/git push[^\n]*--force/);
});

