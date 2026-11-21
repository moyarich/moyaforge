import { compile } from "@mdx-js/mdx";
import { expect, test } from "vitest";
import { createMdxOptions } from "../../packages/moyaforge-mdx/src/mdx/mdx-tooling-options.js";

const options = createMdxOptions({
  componentMappings: {
    "code-preview": {
      component: "InlineCodePreview",
      titleProp: "title",
      sourceProp: "code",
      filesProp: "sourceFiles",
    },
    "*": { component: "CustomBlock", titleProp: "title", typeProp: "type" },
  },
});
function example(attribute = 'preview="example.md"', language = "md") {
  return `::::code-preview[Warning]{${attribute}}\n\n\`\`\`css filename="example.css"\np { color: red; }\n\`\`\`\n\n\`\`\`${language} filename="example.md"\n::: warning Before you continue\n\nSave a **backup**.\n\n:::\n\`\`\`\n\n::::`;
}
test("selected Markdown fence renders a callout while both fences remain source tabs", async () => {
  const output = String(await compile(example(), options));
  expect(output).toContain('type: "warning"');
  expect(output).toContain('title: "Before you continue"');
  expect(output).toContain("_components.strong");
  expect(output).toContain("example.css");
  expect(output).toContain("example.md");
  expect(output).toContain('code: ""');
});
test("unknown fence names fail with a useful error", async () => {
  await expect(
    compile(example('preview="missing.md"'), options),
  ).rejects.toThrow("must match exactly one named code fence");
});
test("unsupported render languages fail explicitly", async () => {
  await expect(compile(example(undefined, "ts"), options)).rejects.toThrow(
    "supports md or markdown",
  );
});
test("component selection and fence selection cannot compete", async () => {
  await expect(
    compile(example('preview="example.md" component="./Example.tsx"'), options),
  ).rejects.toThrow("cannot be combined");
});
