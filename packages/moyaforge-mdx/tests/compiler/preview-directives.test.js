import { test, expect } from "vitest";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions } from "../../dist/index.js";

test("ordinary Markdown preview directives emit declarative host component references", async () => {
  const md =
    "::: preview Counter\n\nexample: ./CounterExample.tsx\n\nsource: ./CounterExample.tsx\n\n:::";
  const result = String(
    await compile(
      { value: md, path: "page.md" },
      createMdxOptions({ filePreviewOptions: true }),
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
        createMdxOptions({ filePreviewOptions: true }),
      ),
    ).rejects.toThrow(/Invalid preview/);
  }
  await expect(
    compile(
      { value: "::: preview Empty\nNothing here.\n:::", path: "page.md" },
      createMdxOptions({ filePreviewOptions: true }),
    ),
  ).rejects.toThrow(/requires an example/);
});

test("preview transformation is opt-in and unrelated directives continue working", async () => {
  const md = "::: warning Alert\nNo example here.\n:::";
  const result = String(
    await compile(
      { value: md, path: "page.md" },
      createMdxOptions({ filePreviewOptions: true }),
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
        createMdxOptions({ filePreviewOptions: true }),
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
      createMdxOptions({ filePreviewOptions: true }),
    ),
  ).rejects.toThrow(/Duplicate preview/);
});

test("host preview resolver validates the authored Markdown path", async () => {
  const seen = [];
  const options = createMdxOptions({
    filePreviewOptions: {
      resolveReference(reference, authoredFile, kind) {
        seen.push([reference, authoredFile, kind]);
        return reference === "./Registered.tsx"
          ? "registered-counter"
          : undefined;
      },
    },
  });
  const valid = String(
    await compile(
      {
        value: "::: preview Counter\n\nexample: ./Registered.tsx\n\n:::",
        path: "docs/demo/page.md",
      },
      options,
    ),
  );
  expect(valid).toContain("registered-counter");
  expect(seen).toEqual([["./Registered.tsx", "docs/demo/page.md", "example"]]);
  await expect(
    compile(
      {
        value: "::: preview Missing\n\nexample: ./Missing.tsx\n\n:::",
        path: "docs/demo/page.md",
      },
      options,
    ),
  ).rejects.toThrow(/Unresolved preview/);
});

test("preview-code preserves authored JSX as source and renders it as children", async () => {
  const body = '<p className="greeting">Hello from MDX.</p>';
  const result = String(
    await compile(
      `::: preview-code Greeting\n\n${body}\n\n:::`,
      createMdxOptions({
        componentMappings: {
          "preview-code": {
            component: "PreviewCodeInline",
            titleProp: "title",
            sourceProp: "code",
          },
        },
      }),
    ),
  );
  expect(result).toContain("PreviewCodeInline");
  expect(result).toContain(`code: ${JSON.stringify(body)}`);
  expect(result).toContain('className: "greeting"');
});

test.each([
  ["::: tip Before you start", ":::", "tip", "Before you start"],
  [":::tip[Before you start]", ":::", "tip", "Before you start"],
  ['::alert{type="warning"}', "::", "warning", undefined],
  ["::: {.callout-note}", ":::", "note", undefined],
])("normalizes %s to a mapped component", async (open, close, type, title) => {
  const result = String(
    await compile(
      `${open}\n\nHello\n\n${close}`,
      createMdxOptions({
        componentMappings: {
          "*": {
            component: "CustomBlock",
            typeProp: "type",
            titleProp: "title",
          },
        },
      }),
    ),
  );
  expect(result).toContain(`type: "${type}"`);
  expect(result).toContain('children: "Hello"');
  if (title) expect(result).toContain(`title: "${title}"`);
});

test("forwards configured directive flags and preserves inline preview source", async () => {
  const result = String(
    await compile(
      ":::preview-code[Fade in]{refresh}\n\n<p>Hello</p>\n\n:::",
      createMdxOptions({
        componentMappings: {
          "preview-code": {
            component: "PreviewCodeInline",
            titleProp: "title",
            sourceProp: "code",
            booleanProps: ["refresh"],
          },
        },
      }),
    ),
  );
  expect(result).toContain('title: "Fade in"');
  expect(result).toContain("refresh: true");
  expect(result).toContain('code: "<p>Hello</p>"');
});

test("uses native directives for code groups and their nested tabs", async () => {
  const result = String(
    await compile(
      "::::code-group[Commands]\n\n:::tab[npm]\n\nInstall with npm.\n\n:::\n\n::::",
      createMdxOptions({
        componentMappings: {
          "code-group": {
            component: "CodeGroup",
            childType: "tab",
            childComponent: "CodeTab",
          },
        },
      }),
    ),
  );
  expect(result).toContain('label: "Commands"');
  expect(result).toContain('label: "npm"');
  expect(result).toContain("_jsx(CodeTab,");
});

test("isolates repeated import names and keeps named fences as preview sources", async () => {
  const registered = [];
  const page = [
    '::::preview-code[First]{preview="First.tsx"}',
    '```tsx filename="First.tsx"',
    'import {\n  First as Greeting,\n} from "./first.js";',
    "",
    "export default function Example() { return <Greeting />; }",
    "```",
    "",
    '```css filename="styles.css"',
    "p { color: red; }",
    "```",
    "",
    "::::",
    "",
    ':::preview-code[Second]{preview="Second.tsx" replacements="portable"}',
    '```tsx filename="Second.tsx"',
    'import { Second as Greeting } from "./second.js";',
    "",
    "export default function Example() { return <Greeting />; }",
    "```",
    "",
    ":::",
  ].join("\n");
  const result = String(
    await compile(
      { value: page, path: "/docs/page.mdx" },
      createMdxOptions({
        componentMappings: {
          "preview-code": {
            component: "PreviewCodeInline",
            sourceProp: "code",
            filesProp: "sourceFiles",
            registerInlineReact(source, file) {
              registered.push({ source, file });
              return `virtual:react-preview/${registered.length}`;
            },
          },
        },
      }),
    ),
  );
  expect(registered).toEqual([
    {
      source:
        'import {\n  First as Greeting,\n} from "./first.js";\n\nexport default function Example() { return <Greeting />; }',
      file: "/docs/page.mdx",
    },
    {
      source:
        'import { Second as Greeting } from "./second.js";\n\nexport default function Example() { return <Greeting />; }',
      file: "/docs/page.mdx",
    },
  ]);
  expect(result).toContain(
    'import MoyaForgeReactPreview0 from "virtual:react-preview/1"',
  );
  expect(result).toContain(
    'import MoyaForgeReactPreview1 from "virtual:react-preview/2"',
  );
  expect(result).toContain("styles.css");
  expect(result.match(/replacementPreset: "portable"/g)).toHaveLength(1);
});

test("file-backed preview errors describe opt-in component root registration", async () => {
  const options = createMdxOptions({
    componentMappings: {
      "preview-code": {
        component: "PreviewCodeInline",
        resolvePreviewCodeComponent: () => undefined,
      },
    },
  });
  const compilePreview = (component) =>
    compile(
      {
        value: `:::preview-code[Example]{component="${component}"}\n\n:::`,
        path: "/docs/warning/page.mdx",
      },
      options,
    );

  await expect(
    compilePreview("../../../../src/components/CodeBlock/CodeBlock.tsx"),
  ).rejects.toThrow(/Unregistered preview component[\s\S]*componentRoots/);

  await expect(compilePreview("./Missing.tsx")).rejects.toThrow(
    /Unregistered preview component[\s\S]*componentRoots/,
  );

  await expect(
    compilePreview(
      "../../../../src/components/CodeBlock/CodeBlock.tsx#Bad;Name",
    ),
  ).rejects.toThrow(/Invalid preview-code component/);
});
