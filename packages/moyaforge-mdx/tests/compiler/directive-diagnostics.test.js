import { test } from "vitest";
import assert from "node:assert/strict";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions, MdxDiagnosticError } from "../../dist/index.js";

const options = createMdxOptions({
  componentMappings: {
    "preview-code": { component: "PreviewCode", directPreviewCode: true },
  },
});

for (const [attribute, code] of [
  ["component=123", "MDX_INVALID_DIRECTIVE_ATTRIBUTE"],
  ['component="Example.tsx"', "MDX_INVALID_COMPONENT_REFERENCE"],
  ['component="./Missing.tsx"', "MDX_COMPONENT_NOT_REGISTERED"],
]) {
  test("preview diagnostic: " + code, async () => {
    const source = "# Guide\n\n:::preview-code[Example]{" + attribute + "}\n\n:::";
    await assert.rejects(compile({ value: source, path: "docs/page.mdx" }, options), error => {
      assert.ok(error instanceof MdxDiagnosticError);
      const d = error.diagnostic;
      assert.equal(d.code, code);
      assert.equal(d.directive, "preview-code");
      assert.equal(d.attribute, "component");
      assert.equal(d.location.file, "docs/page.mdx");
      assert.equal(d.location.line, 3);
      assert.ok(d.suggestion);
      assert.ok(d.frame);
      return true;
    });
  });
}
