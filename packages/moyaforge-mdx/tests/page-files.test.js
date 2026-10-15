import assert from "node:assert/strict";
import { test } from "vitest";
import { isContentPageFile } from "../dist/source-files.js";

test("canonical page matching works across nested Unix and Windows paths", () => {
  for (const file of [
    "page.md",
    "page.mdx",
    "docs/01-guide/page.md",
    "docs\\01-guide\\page.mdx",
  ]) {
    assert.equal(isContentPageFile(file), true, file);
  }
  for (const file of [
    "README.md",
    "docs/page.md.bak",
    "docs/not-page.mdx",
    "docs/page.markdown",
    "docs/PAGE.md",
    "docs/page.mdx.js",
  ]) {
    assert.equal(isContentPageFile(file), false, file);
  }
});
