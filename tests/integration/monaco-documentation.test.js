import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions } from "@moyarich/moyaforge-mdx";
import { expect, test } from "vitest";

const docs = resolve(import.meta.dirname, "../../packages/moyaforge-ui/docs/01-components");
const examples = [
  "200-monaco-editor-react/10-editable-workspace/page.mdx",
  "200-monaco-editor-react/20-read-only/page.mdx",
  "200-monaco-editor-react/40-textarea/page.mdx",
  "210-monaco-editor-typefox/10-editable-workspace/page.mdx",
  "210-monaco-editor-typefox/20-read-only/page.mdx",
  "210-monaco-editor-typefox/40-textarea/page.mdx",
  "210-monaco-editor-typefox/50-shared-runtime/page.mdx",
  "221-preview-code-editor/10-monaco-editor/page.mdx",
];

test.each(examples)("%s compiles without invalid MDX module syntax or removed worker imports", async (page) => {
  const source = await readFile(resolve(docs, page), "utf8");
  expect(source).not.toMatch(/from ["'][^"']*setup-(?:react-monaco-worker|typefox-monaco-workers)\.ts\?raw["']/);
  await expect(compile(source, createMdxOptions())).resolves.toBeDefined();
});
