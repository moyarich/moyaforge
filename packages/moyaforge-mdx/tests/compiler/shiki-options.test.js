import assert from "node:assert/strict";
import { test } from "vitest";
import { createMdxOptions } from "../../dist/index.js";

test("Shiki integration is optional and maintains deterministic rehype ordering", () => {
  const shiki = () => {};
  const additional = () => {};
  const defaults = createMdxOptions();
  const configured = createMdxOptions({
    shiki: [shiki, { themes: { light: "github-light", dark: "github-dark" } }],
    rehypePlugins: [additional],
  });
  assert.equal(
    configured.rehypePlugins.length,
    defaults.rehypePlugins.length + 2,
  );
  assert.deepEqual(configured.rehypePlugins.at(-2), [
    shiki,
    { themes: { light: "github-light", dark: "github-dark" } },
  ]);
  assert.equal(configured.rehypePlugins.at(-1), additional);
  assert.deepEqual(
    configured.rehypePlugins.slice(0, defaults.rehypePlugins.length),
    defaults.rehypePlugins,
  );
});
