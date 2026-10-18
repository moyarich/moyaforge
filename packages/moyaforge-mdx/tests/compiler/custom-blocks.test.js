import assert from "node:assert/strict";
import { test } from "vitest";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions } from "../../dist/index.js";

test("arbitrary custom block types produce generic HTML classes and data attributes", async () => {
  const source = [
    "::: warning Handle Missing Options",
    "Always provide **defaults**.",
    "",
    "```ts",
    "const threshold = 0.1;",
    "```",
    ":::",
    "",
    "::: experimental New Feature",
    "A [link](/guide) is still Markdown.",
    ":::",
  ].join("\n");
  const output = String(
    await compile({ value: source, path: "page.mdx" }, createMdxOptions()),
  );
  assert.match(output, /custom-block/);
  assert.match(output, /warning/);
  assert.match(output, /data-type/);
  assert.match(output, /Handle Missing Options/);
  assert.match(output, /custom-block-title/);
  assert.match(output, /threshold = 0.1/);
  assert.match(output, /experimental/);
  assert.match(output, /New Feature/);
  assert.match(output, /href: "\/guide"/);
});

test("blocks without titles preserve content", async () => {
  const source = "::: arbitrary\nUnstyled custom content.\n:::";
  const output = String(
    await compile({ value: source, path: "page.md" }, createMdxOptions()),
  );
  assert.match(output, /arbitrary/);
  assert.match(output, /Unstyled custom content/);
  assert.doesNotMatch(output, /custom-block-title/);
});

test("nested custom blocks retain independent types and titles", async () => {
  const source = [
    ":::: experimental Experimental Feature",
    "",
    "This feature is under development.",
    "",
    "::: warning Compatibility",
    "This API may change.",
    ":::",
    "",
    "::: tip Performance",
    "Caching is recommended.",
    ":::",
    "",
    "::::",
  ].join("\n");
  const output = String(
    await compile({ value: source, path: "page.mdx" }, createMdxOptions()),
  );
  for (const expected of [
    "experimental",
    "warning",
    "tip",
    "Experimental Feature",
    "Compatibility",
    "Performance",
    "Caching is recommended",
  ]) {
    assert.ok(output.includes(expected), expected);
  }
  assert.equal((output.match(/custom-block-title/g) ?? []).length, 3);
});
