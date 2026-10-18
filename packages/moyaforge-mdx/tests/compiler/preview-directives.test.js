import { test, expect } from "vitest";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions } from "../../dist/index.js";

test("ordinary Markdown preview directives emit declarative host component references", async () => {
  const md =
    "::: preview Counter\n\nexample: ./CounterExample.tsx\n\nsource: ./CounterExample.tsx\n\n:::";
  const result = String(
    await compile(
      { value: md, path: "page.md" },
      createMdxOptions({ previewDirectives: true }),
    ),
  );
  expect(result).toContain("PreviewDirective");
  expect(result).toContain("./CounterExample.tsx");
  expect(result).toContain("Counter");
});

test("preview directives reject unsafe and missing references", async () => {
  for (const ref of [
    "../secret.tsx",
    "/absolute.tsx",
    "./sub/../private.tsx",
    "./file.tsx?raw",
  ]) {
    await expect(
      compile(
        {
          value: `::: preview Unsafe\n\nexample: ${ref}\n\n:::`,
          path: "page.md",
        },
        createMdxOptions({ previewDirectives: true }),
      ),
    ).rejects.toThrow(/Invalid preview/);
  }
  await expect(
    compile(
      { value: "::: preview Empty\nNothing here.\n:::", path: "page.md" },
      createMdxOptions({ previewDirectives: true }),
    ),
  ).rejects.toThrow(/requires an example/);
});

test("preview transformation is opt-in and unrelated directives continue working", async () => {
  const md = "::: warning Alert\nNo example here.\n:::";
  const result = String(
    await compile(
      { value: md, path: "page.md" },
      createMdxOptions({ previewDirectives: true }),
    ),
  );
  expect(result).toContain("custom-block");
  expect(result).not.toContain("PreviewDirective");
});

test("preview directives reject malformed references and duplicate declarations", async () => {
  for (const ref of [
    "./",
    "./.hidden.tsx",
    "./a//b.tsx",
    "./file.txt",
    "./file.tsx#fragment",
    "./sub/./Example.tsx",
  ]) {
    await expect(
      compile(
        {
          value: `::: preview Invalid\n\nexample: ${ref}\n\n:::`,
          path: "page.md",
        },
        createMdxOptions({ previewDirectives: true }),
      ),
    ).rejects.toThrow(/Invalid preview/);
  }
  await expect(
    compile(
      {
        value:
          "::: preview Duplicate\n\nexample: ./A.tsx\n\nexample: ./B.tsx\n\n:::",
        path: "page.md",
      },
      createMdxOptions({ previewDirectives: true }),
    ),
  ).rejects.toThrow(/Duplicate preview/);
});
