import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions, extractPageHeadings, createPreviewCodeRegistry } from "../../dist/index.js";

test("isolates TypeScript in React previews while retaining original source", async () => {
  const path = fileURLToPath(new URL("../fixtures/preview-react/typescript.mdx", import.meta.url));
  const source = await readFile(path, "utf8");
  const registry = createPreviewCodeRegistry({ root: ".", sources: {}, pages: [] });
  let id;
  let captured;
  const output = String(await compile({ value: source, path }, createMdxOptions({
    componentMappings: {
      "preview-code": {
        component: "PreviewCode", directPreviewCode: true,
        registerInlineReact(body, file, options) {
          captured = body;
          id = registry.inlineReact.register(body, file, options);
          return id;
        },
      },
    },
  })));
  expect(captured).toContain("const items: Item[]");
  expect(captured).toContain("<T,>");
  expect(output).toContain(id);
  const compiled = await registry.inlineReact.load(registry.inlineReact.resolve(id));
  expect(compiled).toContain("export default function MoyaForgePreview");
  expect(compiled).not.toContain("type Item");
  const headings = await extractPageHeadings(source, path);
  expect(JSON.stringify(headings)).toContain("after-preview");
});

test("ordinary MDX still rejects TypeScript expressions", async () => {
  await expect(compile({ value: "<p>{1 as number}</p>", path: "page.mdx" },
    createMdxOptions())).rejects.toThrow(/acorn/i);
});
