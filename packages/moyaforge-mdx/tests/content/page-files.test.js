import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "vitest";
import { isContentPageFile, discoverSourceFilesSync } from "../../dist/content/source-files.js";

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

test("canonical source discovery matches Markdown and MDX through one brace glob", () => {
  const root = mkdtempSync(join(tmpdir(), "moyaforge-brace-pages-"));
  try {
    mkdirSync(join(root, "guides"));
    writeFileSync(join(root, "page.md"), "# Home");
    writeFileSync(join(root, "guides", "page.mdx"), "# Guide");
    writeFileSync(join(root, "README.md"), "# Not a canonical page");
    assert.deepEqual(
      discoverSourceFilesSync(root).map(({ relative }) => relative).sort(),
      ["guides/page.mdx", "page.md"],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
