import { test } from "vitest";
import assert from "node:assert/strict";
import { createMdxOptions } from "../../dist/index.js";

test("compiler defaults are independent and fresh per invocation", () => {
  const first = createMdxOptions();
  const second = createMdxOptions();
  assert.equal(first.providerImportSource, "@mdx-js/react");
  assert.ok(
    first.remarkPlugins.some(
      (plugin) =>
        Array.isArray(plugin) && plugin[1]?.containerTagName === "div",
    ),
  );
  assert.ok(first.rehypePlugins.length > 0);
  assert.notStrictEqual(first.remarkPlugins, second.remarkPlugins);
});

test("host plugins extend defaults without replacing shared conventions", () => {
  const customRemark = () => {};
  const customRehype = () => {};
  const options = createMdxOptions({
    remarkPlugins: [customRemark],
    rehypePlugins: [customRehype],
  });
  assert.ok(options.remarkPlugins.includes(customRemark));
  assert.ok(options.rehypePlugins.includes(customRehype));
  assert.ok(
    options.remarkPlugins.some(
      (plugin) =>
        Array.isArray(plugin) && plugin[1]?.containerTagName === "div",
    ),
  );
});
