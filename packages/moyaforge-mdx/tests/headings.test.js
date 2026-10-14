import assert from "node:assert/strict";
import { test } from "node:test";
import { extractPageHeadings, discoverContent } from "../dist/index.js";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("Markdown headings use rehype-slug IDs, including duplicate suffixes", async () => {
  const headings = await extractPageHeadings(
    "---\ntitle: Intro\n---\n# Intro\n\n## Setup\n\n### Options\n\n### Options\n",
  );
  assert.equal(headings[0].id, "intro");
  assert.equal(headings[0].children[0].id, "setup");
  assert.deepEqual(
    headings[0].children[0].children.map((h) => h.id),
    ["options", "options-1"],
  );
});

test("build-time content discovery indexes heading trees without importing components", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-toc-"));
  try {
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(
      join(root, "docs", "page.md"),
      "---\ntitle: Welcome\n---\n# Welcome\n\n## Start",
    );
    const result = await discoverContent(
      { sources: { docs: { base: "docs", include: ["**/page.md"] } } },
      root,
    );
    assert.equal(result.headings["docs/page.md"][0].id, "welcome");
    assert.equal(result.headings["docs/page.md"][0].children[0].id, "start");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
