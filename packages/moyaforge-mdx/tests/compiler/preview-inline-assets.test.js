import { expect, test } from "vitest";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions } from "../../dist/index.js";
import { createInlineReactModules } from "../../dist/vite/code-preview/inline-react-modules.js";
import { maskInlinePreviewAssets } from "../../dist/plugins/remark/code-preview/mask-inline-preview-assets.js";

const preview = [
  "::::code-preview[Custom success]",
  "",
  "<style>",
  ".custom-block.ui-success {",
  "  --mf-custom-block-bg: #e9f9f1;",
  "}",
  "</style>",
  "",
  "::: ui-success Changes saved",
  "",
  "Your settings have been updated successfully.",
  "",
  ":::",
  "",
  "<script>",
  'const alert = root.querySelector(".custom-block.ui-success");',
  'if (alert) alert.setAttribute("title", "ready");',
  "</script>",
  "",
  "::::",
].join("\n");

test("raw CSS and JavaScript in Markdown previews are compiled as isolated preview modules", async () => {
  const modules = createInlineReactModules();
  const registered = [];
  const page = "/docs/custom-callout/page.mdx";
  const output = String(
    await compile(
      { value: preview, path: page },
      createMdxOptions({
        componentMappings: {
          "code-preview": {
            component: "InlineCodePreview",
            titleProp: "title",
            sourceProp: "code",
            registerInlineReact(source, authoredFile) {
              const id = modules.register(source, authoredFile);
              registered.push({ source, authoredFile, id });
              return id;
            },
          },
          "*": { component: "CustomBlock", typeProp: "type", titleProp: "title" },
        },
      }),
    ),
  );

  expect(registered).toHaveLength(2);
  expect(registered.every((item) => item.authoredFile === page)).toBe(true);
  expect(registered[0].source).toContain("<style>{");
  expect(registered[0].source).toContain("--mf-custom-block-bg");
  expect(registered[1].source).toContain('const root = anchor.current?.closest(".mf-preview-stage");');
  expect(registered[1].source).toContain('root.querySelector(".custom-block.ui-success")');
  expect(output).toContain("MoyaForgeReactPreview0");
  expect(output).toContain("MoyaForgeReactPreview1");
  expect(output).toContain('type: "ui-success"');
  expect(output).toContain("--mf-custom-block-bg");
  expect(output).toContain('const alert = root.querySelector');

  // The generated virtual modules must also be valid, compilable MDX.
  for (const { id } of registered) {
    const resolved = modules.resolve(id);
    expect(resolved).toBeTruthy();
    const generated = await modules.load(resolved);
    expect(generated).toContain("function _createMdxContent");
  }
});

test("only standalone raw tags within Markdown previews are masked", () => {
  const source = [
    "<style>",
    "body { color: red; }",
    "</style>",
    "",
    "::::code-preview[Source]",
    "",
    "~~~css",
    "<style>",
    "body { color: blue; }",
    "</style>",
    "~~~",
    "",
    "::::",
  ].join("\n");
  const result = maskInlinePreviewAssets(source.split(/(?<=\n)/));
  expect(result.assets).toEqual([]);
  expect(result.lines.join("")).toBe(source);
});

test("unclosed preview-local style or script has a useful error", async () => {
  for (const tag of ["style", "script"]) {
    await expect(
      compile(
        { value: ":::code-preview[Missing]\n<" + tag + ">\nbody { color: red; }\n:::", path: "page.mdx" },
        createMdxOptions(),
      ),
    ).rejects.toThrow("Unclosed <" + tag + ">");
  }
});

test("plain Markdown and React previews keep their existing parsing", async () => {
  const registrations = [];
  const source = [
    ":::code-preview[React]{react}",
    "",
    'import Demo from "./Demo.js";',
    "",
    "<Demo />",
    "",
    ":::",
  ].join("\n");
  const output = String(
    await compile(
      { value: source, path: "/docs/page.mdx" },
      createMdxOptions({
        componentMappings: {
          "code-preview": {
            component: "InlineCodePreview",
            sourceProp: "code",
            registerInlineReact(code, path) {
              registrations.push([code, path]);
              return "virtual:react-demo";
            },
          },
        },
      }),
    ),
  );
  expect(registrations).toEqual([
    ['import Demo from "./Demo.js";\n\n<Demo />', "/docs/page.mdx"],
  ]);
  expect(output).toContain("virtual:react-demo");
});
