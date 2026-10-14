import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getTableOfContents } from "../dist/toc.js";

test("TOC entrypoint is usable without Node content-discovery modules", async () => {
  const source = await readFile(
    new URL("../dist/toc.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /(?:node:|tinyglobby|remark-|rehype-|\.\/content|\.\/links)/,
  );
  const toc = getTableOfContents([
    { id: "install", value: "Install", depth: 2 },
  ]);
  assert.equal(toc.options.placement, "right");
  assert.equal(toc.headings[0].id, "install");
});
