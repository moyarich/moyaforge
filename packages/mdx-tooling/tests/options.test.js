import { test } from "node:test";
import assert from "node:assert/strict";
import { createMdxOptions } from "../dist/index.js";

test("compiler defaults are independent and fresh per invocation", () => {
  const first = createMdxOptions();
  const second = createMdxOptions();
  assert.equal(first.providerImportSource, "@mdx-js/react");
  assert.equal(first.remarkPlugins.length, 3);
  assert.equal(first.rehypePlugins.length, 3);
  assert.notStrictEqual(first.remarkPlugins, second.remarkPlugins);
});
