import assert from "node:assert/strict";
import { test } from "vitest";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions } from "../../dist/index.js";

test("fenced code language is normalized onto pre at compile time", async () => {
  const output = String(
    await compile(
      { value: "~~~tsx\nconst answer = 42;\n~~~", path: "page.mdx" },
      createMdxOptions(),
    ),
  );
  assert.match(output, /"data-language": "tsx"/);
  assert.match(output, /language-tsx/);
});

test("unlabeled code fences do not acquire a fake language", async () => {
  const output = String(
    await compile(
      { value: "~~~\nplain text\n~~~", path: "page.mdx" },
      createMdxOptions(),
    ),
  );
  assert.doesNotMatch(output, /"data-language"/);
});
