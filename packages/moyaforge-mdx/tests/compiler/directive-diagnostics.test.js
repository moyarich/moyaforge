import { test } from "vitest";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions, MdxDiagnosticError } from "../../dist/index.js";

const options = createMdxOptions({
  componentMappings: {
    "preview-code": { component: "PreviewCode", directPreviewCode: true },
  },
});

for (const [fixture, code] of [
  ["directives/invalid-attribute.mdx", "MDX_INVALID_DIRECTIVE_ATTRIBUTE"],
  ["resolution/invalid-reference.mdx", "MDX_INVALID_COMPONENT_REFERENCE"],
  ["resolution/missing-component.mdx", "MDX_COMPONENT_NOT_REGISTERED"],
]) {
  test("preview diagnostic: " + code, async () => {
    const path = fileURLToPath(new URL("../fixtures/diagnostics/" + fixture, import.meta.url));
    const source = await readFile(path, "utf8");
    await assert.rejects(compile({ value: source, path }, options), error => {
      assert.ok(error instanceof MdxDiagnosticError);
      const d = error.diagnostic;
      assert.equal(d.code, code);
      assert.equal(d.directive, "preview-code");
      assert.equal(d.attribute, "component");
      assert.equal(d.location.file, path);
      assert.equal(d.location.line, 3);
      assert.ok(d.suggestion);
      assert.ok(d.frame);
      return true;
    });
  });
}
