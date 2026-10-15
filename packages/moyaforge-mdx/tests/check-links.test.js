import { test } from "vitest";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkContentLinks, formatLinkIssues } from "../dist/index.js";

test("build-time link checker uses the configured content roots", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-links-"));
  try {
    await mkdir(join(root, "docs", "01-guide"), { recursive: true });
    await writeFile(
      join(root, "docs", "page.md"),
      "# Home\n\n[Valid](./guide#setup) [Missing](./guide#typo)",
    );
    await writeFile(
      join(root, "docs", "01-guide", "page.md"),
      "# Guide\n\n## Setup",
    );
    const issues = await checkContentLinks(
      {
        sources: { docs: { base: "docs", include: ["**/page.md"] } },
      },
      root,
    );
    assert.equal(issues.length, 1);
    assert.deepEqual(issues[0], {
      file: "docs/page.md",
      href: "./guide#typo",
      reason: "missing-anchor",
    });
    assert.equal(
      formatLinkIssues(issues),
      "docs/page.md: missing-anchor: ./guide#typo",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
