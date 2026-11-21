import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compile } from "@mdx-js/mdx";
import { expect, test } from "vitest";
import { createMdxOptions } from "../../packages/moyaforge-mdx/src/mdx/mdx-tooling-options.js";

test("Markdown code-group example keeps both tabs inside the selected source fence", async () => {
  const path = resolve(
    "packages/moyaforge-ui/docs/01-components/20-code-group/10-tabs-in-md/page.mdx",
  );
  const value = await readFile(path, "utf8");
  const output = String(
    await compile(
      { value, path },
      createMdxOptions({
        componentMappings: {
          "code-preview": {
            component: "Preview",
            filesProp: "files",
            sourceProp: "code",
          },
          "code-group": {
            component: "CodeGroup",
            childType: "tab",
            childComponent: "CodeTab",
          },
        },
      }),
    ),
  );
  expect(output).toContain('label: "npm"');
  expect(output).toContain('label: "pnpm"');
  expect(output).toContain("npm install react");
  expect(output).toContain("pnpm add react");
  expect(output).toContain("@scope");
});
