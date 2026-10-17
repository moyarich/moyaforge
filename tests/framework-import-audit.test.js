import { expect, test } from "vitest";
import { execFileSync } from "node:child_process";

test("framework public entrypoints have no extracted UI dependencies", () => {
  const output = execFileSync(
    process.execPath,
    [new URL("../scripts/audit-framework-imports.mjs", import.meta.url).pathname],
    { encoding: "utf8" },
  );
  const report = JSON.parse(output);
  expect(Object.keys(report).sort()).toEqual([
    "headless.ts",
    "index.ts",
    "registry-routes.tsx",
  ]);
  for (const [entrypoint, result] of Object.entries(report)) {
    expect(result.sourceFiles, entrypoint).toBeGreaterThan(1);
    expect(result.extractedUiFiles, entrypoint).toBe(0);
    expect(result.extractedUiImports, entrypoint).toEqual([]);
  }
});
