import { test } from "node:test";
import assert from "node:assert/strict";
import { createMdxOptions } from "../dist/index.js";

test("compiler defaults are independent and fresh per invocation", () => {
  const first = createMdxOptions();
  const second = createMdxOptions();
  assert.equal(first.providerImportSource, "@mdx-js/react");
  assert.equal(first.remarkPlugins.length, 2);
  assert.equal(first.rehypePlugins.length, 3);
  assert.notStrictEqual(first.remarkPlugins, second.remarkPlugins);
});

test("host plugins extend defaults without replacing shared conventions", () => {
  const customRemark = () => {};
  const customRehype = () => {};
  const options = createMdxOptions({
    remarkPlugins: [customRemark],
    rehypePlugins: [customRehype],
  });
  assert.equal(options.remarkPlugins[2], customRemark);
  assert.equal(options.remarkPlugins.length, 3);
  assert.equal(options.rehypePlugins[3], customRehype);
});
