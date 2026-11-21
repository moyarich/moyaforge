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
    "requires the Vite code-preview plugin",
  );
});
test("component selection and fence selection cannot compete", async () => {
  await expect(
    compile(example('preview="example.md" component="./Example.tsx"'), options),
  ).rejects.toThrow("cannot be combined");
});

test("selected CSS is scoped and rendered as text alongside Markdown", async () => {
  const output = String(
    await compile(example('preview="example.md, example.css"'), options),
  );
  expect(output).toContain('type: "warning"');
  expect(output).toContain("_components.strong");
  expect(output).toContain("@scope (.mf-preview-fence-");
  expect(output).toContain("p { color: red; }");
  expect(output).toContain('children: "@scope');
});
test("CSS remains source-only when it is not selected", async () => {
  const output = String(await compile(example(), options));
  expect(output).not.toContain("@scope");
});
test("CSS-only selections work and duplicate names are rejected", async () => {
  expect(
    String(await compile(example('preview="example.css"'), options)),
  ).toContain("@scope");
  await expect(
    compile(example('preview="example.md,example.md"'), options),
  ).rejects.toThrow("distinct, nonempty");
});

test("multiple Markdown entries render in the selected order", async () => {
  const value =
    '::::code-preview[Multiple]{preview="second.md,first.md"}\n\n```md filename="first.md"\nFirst\n```\n\n```md filename="second.md"\nSecond\n```\n\n::::';
  const output = String(await compile(value, options));
  expect(output).toContain('children: "Second"');
  expect(output).toContain('children: "First"');
  expect(output.indexOf('children: "Second"')).toBeLessThan(
    output.indexOf('children: "First"'),
  );
});
test("selected Markdown uses the configured remark plugins", async () => {
  const configured = createMdxOptions({
    componentMappings: {
      "code-preview": { component: "Preview", filesProp: "files" },
    },
    additionalRemarkPlugins: [
      () => (tree) => {
        function visit(node) {
          if (node.type === "text" && node.value === "Custom text")
            node.value = "Transformed text";
          node.children?.forEach(visit);
        }
        visit(tree);
      },
    ],
  });
  const output = String(
    await compile(
      '::::code-preview[Test]{preview="entry.md"}\n\n```md filename="entry.md"\nCustom text\n```\n\n::::',
      configured,
    ),
  );
  expect(output).toContain('children: "Transformed text"');
});
test("selected HTML renders markup without Markdown escaping", async () => {
  const output = String(
    await compile(
      '::::code-preview[HTML]{preview="entry.html"}\n\n```html filename="entry.html"\n<strong>Hello</strong>\n```\n\n::::',
      options,
    ),
  );
  expect(output).toContain("dangerouslySetInnerHTML");
  expect(output).toContain('__html: "<strong>Hello</strong>"');
});

test("shell and other code languages render as code blocks", async () => {
  const output = String(await compile(example(undefined, "sh"), options));
  expect(output).toContain("language-sh");
  expect(output).toContain("Save a **backup**");
});
