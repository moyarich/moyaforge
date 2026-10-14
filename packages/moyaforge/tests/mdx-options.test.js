import assert from "node:assert/strict";
import test from "node:test";
import { createMdxOptions } from "@moyarich/moyaforge-mdx";
import { createMoyaForgeMdxOptions } from "../dist/mdx-options.js";

test("legacy MDX options use the canonical compiler defaults", () => {
  const canonical = createMdxOptions({ frontmatterExport: true });
  const legacy = createMoyaForgeMdxOptions();
  assert.equal(legacy.providerImportSource, canonical.providerImportSource);
  assert.deepEqual(legacy.remarkPlugins, canonical.remarkPlugins);
  assert.deepEqual(legacy.rehypePlugins, canonical.rehypePlugins);
  assert.notStrictEqual(
    legacy.remarkPlugins,
    createMoyaForgeMdxOptions().remarkPlugins,
  );
});
