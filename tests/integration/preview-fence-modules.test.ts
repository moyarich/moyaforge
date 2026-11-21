import { compile } from "@mdx-js/mdx";
import { expect, test } from "vitest";
import { createInlineReactModules } from "../../packages/moyaforge-mdx/src/vite/code-preview/inline-react-modules.js";
import { createMdxOptions } from "../../packages/moyaforge-mdx/src/mdx/mdx-tooling-options.js";

test("TSX modules compile types and resolve inline JSON and TypeScript dependencies", async () => {
  const modules = createInlineReactModules();
  const id = modules.register(
    'import { message } from "./config"; export default function Demo() { const text: string = message; return <strong>{text}</strong>; }',
    "/docs/page.mdx",
    {
      format: "tsx",
      filename: "Demo.tsx",
      files: [
        {
          label: "config.ts",
          language: "ts",
          code: 'export const message: string = "Hello";',
        },
        { label: "settings.json", language: "json", code: '{"enabled":true}' },
      ],
    },
  );
  const resolved = modules.resolve(id)!;
  const output = await modules.load(resolved);
  expect(output).toContain('"react/jsx-runtime"');
  expect(output).not.toContain(": string");
  const config = modules.resolveImport("./config", resolved)!;
  expect(await modules.load(config)).toContain('const message = "Hello"');
  const json = modules.resolveImport("./settings.json", resolved)!;
  expect(await modules.load(json)).toBe('export default {"enabled":true};');
});

test("MDX fence imports stay isolated and its directives use the host compiler options", async () => {
  const modules = createInlineReactModules();
  const options = createMdxOptions({
    componentMappings: {
      "code-preview": {
        component: "Preview",
        filesProp: "files",
        registerInlineReact: modules.register,
      },
      "*": { component: "Callout", typeProp: "type", titleProp: "title" },
    },
  });
  const value =
    '::::code-preview[Test]{preview="entry.mdx"}\n\n```mdx filename="entry.mdx"\nimport Button from "./Button.tsx";\n\n::: warning Notice\n\nHello\n\n:::\n\n<Button />\n```\n\n```tsx filename="Button.tsx"\nexport default function Button() { return <button>Click</button>; }\n```\n\n::::';
  const output = String(
    await compile({ value, path: "/docs/page.mdx" }, options),
  );
  const id = /from "(virtual:moyaforge-mdx\/react-preview\/[^\"]+)"/.exec(
    output,
  )![1];
  const resolved = modules.resolve(id)!;
  const compiled = await modules.load(resolved);
  expect(compiled).toContain('type: "warning"');
  expect(compiled).toContain('title: "Notice"');
  expect(modules.resolveImport("./Button.tsx", resolved)).toBeDefined();
  expect(output).not.toMatch(/^import Button/m);
});

test("Vite bundles a TSX fence with inline TypeScript, JSON, and CSS dependencies", async () => {
  const { build } = await import("vite");
  const { createCodePreviewRegistry, createCodePreviewPlugin } =
    await import("../../packages/moyaforge-mdx/src/vite/code-preview/code-preview.js");
  const codePreview = createCodePreviewRegistry({
    root: process.cwd(),
    sources: {},
    pages: [],
  });
  const entry = codePreview.inlineReact.register(
    'import { label } from "./config"; import settings from "./settings.json"; import "./styles.css"; export default function Demo() { return <button>{label + settings.suffix}</button>; }',
    `${process.cwd()}/page.mdx`,
    {
      format: "tsx",
      filename: "Demo.tsx",
      files: [
        {
          label: "config.ts",
          language: "ts",
          code: 'export const label: string = "Hello";',
        },
        { label: "settings.json", language: "json", code: '{"suffix":"!"}' },
        {
          label: "styles.css",
          language: "css",
          code: "button { color: red; }",
        },
      ],
    },
  );
  const result = await build({
    configFile: false,
    logLevel: "silent",
    plugins: [
      createCodePreviewPlugin({ codePreview }),
      {
        name: "preview-test-entry",
        resolveId(id) {
          if (id.endsWith("preview-test-entry.js"))
            return "\0preview-test-entry";
        },
        load(id) {
          if (id === "\0preview-test-entry")
            return `export { default } from ${JSON.stringify(entry)};`;
        },
      },
    ],
    build: {
      write: false,
      lib: {
        entry: `${process.cwd()}/preview-test-entry.js`,
        formats: ["es"],
        fileName: "preview",
      },
      rolldownOptions: { external: ["react", "react/jsx-runtime"] },
    },
  });
  const bundles = Array.isArray(result) ? result : [result];
  const code = bundles
    .flatMap((bundle) => ("output" in bundle ? bundle.output : []))
    .filter((chunk) => chunk.type === "chunk")
    .map((chunk) => chunk.code)
    .join("\n");
  expect(code).toContain("Hello");
  expect(code).toContain("button { color: red; }");
  expect(code).not.toContain(": string");
});

test("react directive bodies support complete typed modules without leaking exports into MDX", async () => {
  const modules = createInlineReactModules();
  const value =
    '::::code-preview[Module]{react replacements="portable"}\n\nexport default function Example() {\n  const label: string = "Hello";\n  return <strong>{label}</strong>;\n}\n\n::::';
  const options = createMdxOptions({
    componentMappings: {
      "code-preview": {
        component: "Preview",
        sourceProp: "code",
        filesProp: "files",
        registerInlineReact: modules.register,
      },
    },
  });
  const output = String(
    await compile({ value, path: "/docs/page.mdx" }, options),
  );
  const id = /from "(virtual:moyaforge-mdx\/react-preview\/[^\"]+)"/.exec(
    output,
  )![1];
  const module = await modules.load(modules.resolve(id)!);
  expect(module).toContain('"react/jsx-runtime"');
  expect(module).toContain("function Example");
  expect(module).not.toContain(": string");
  expect(output).toContain('replacementPreset: "portable"');
});
