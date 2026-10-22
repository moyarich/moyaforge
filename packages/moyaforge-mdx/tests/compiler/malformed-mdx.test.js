import { expect, test } from "vitest";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions } from "../../dist/index.js";

test("malformed MDX reports the source file and position", async () => {
  const source = "## Heading\n\n<Missing\n";
  let failure;
  try {
    await compile(
      { value: source, path: "docs/broken/page.mdx" },
      createMdxOptions(),
    );
  } catch (error) {
    failure = error;
  }
  expect(failure).toBeDefined();
  expect(String(failure.message)).not.toBe("");
  expect(failure.line).toBeGreaterThan(0);
});
