import { expect, test } from "vitest";
import { execFileSync } from "node:child_process";

test("framework import audit follows TypeScript .js source re-exports", () => {
  const output = execFileSync(
    process.execPath,
    [
      new URL("../scripts/audit-framework-imports.mjs", import.meta.url)
        .pathname,
    ],
    { encoding: "utf8" },
  );
  const report = JSON.parse(output);
  expect(report["index.ts"].sourceFiles).toBeGreaterThan(1);
  expect(report["docs.ts"].sourceFiles).toBeGreaterThan(1);
  expect(report["registry-routes.tsx"].sourceFiles).toBeGreaterThan(1);
  expect(report["utils/mdx/index.ts"].sourceFiles).toBeGreaterThan(1);
  expect(report["index.ts"].extractedUiImports).toContain(
    "components/SidebarV2/index.ts",
  );
  expect(report["docs.ts"].extractedUiImports).toContain(
    "components/Layout/DocsLayout/DocsLayout.tsx",
  );
});
