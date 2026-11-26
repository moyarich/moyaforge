import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import { compile } from "@mdx-js/mdx";
import { createMdxOptions } from "../../dist/index.js";
import { createInlineReactModules } from "../../dist/vite/preview-code/inline-react-modules.js";
import { maskInlinePreviewAssets } from "../../dist/plugins/remark/preview-code/mask-inline-preview-assets.js";

const preview = [
  "::::preview-code[Custom success]",
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

test("trusted Markdown CSS renders while script source stays visible without execution", async () => {
  const modules = createInlineReactModules();
  const registered = [];
  const page = "/docs/custom-callout/page.mdx";
  const output = String(
    await compile(
      { value: preview, path: page },
      createMdxOptions({
        allowInlinePreviewStyles: true,
        componentMappings: {
          "preview-code": {
            component: "PreviewCodeInline",
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

  expect(registered).toHaveLength(1);
  expect(registered.every((item) => item.authoredFile === page)).toBe(true);
  expect(registered[0].source).toContain("<style>{");
  expect(registered[0].source).toContain("--mf-custom-block-bg");
  expect(output).toContain("MoyaForgeReactPreview0");
  expect(output).not.toContain("MoyaForgeReactPreview1");
  expect(output).toContain('type: "ui-success"');
  expect(output).toContain("--mf-custom-block-bg");
  expect(output).toContain('const alert = root.querySelector');
  expect(output).toContain("<script>");
  expect(output).toContain("</script>");
  expect(output).toContain("<style>");
  expect(output).toContain("</style>");

  // The generated virtual modules must also be valid, compilable MDX.
  for (const { id } of registered) {
    const resolved = modules.resolve(id);
    expect(resolved).toBeTruthy();
    const generated = await modules.load(resolved);
    expect(generated).toContain("function _createMdxContent");
  }
});

test("untrusted previews preserve CSS and JavaScript source, without rendering either", async () => {
  const registered = [];
  const output = String(
    await compile(
      { value: preview, path: "/docs/untrusted/page.mdx" },
      createMdxOptions({
        componentMappings: {
          "preview-code": {
            component: "PreviewCodeInline",
            titleProp: "title",
            sourceProp: "code",
            registerInlineReact(source) {
              registered.push(source);
              return "virtual:unsafe-preview";
            },
          },
          "*": { component: "CustomBlock", typeProp: "type", titleProp: "title" },
        },
      }),
    ),
  );

  expect(registered).toEqual([]);
  expect(output).toContain("<script>");
  expect(output).toContain("</script>");
  expect(output).toContain("<style>");
  expect(output).toContain("--mf-custom-block-bg: #e9f9f1");
  expect(output).toContain("root.querySelector");
  expect(output).not.toContain("virtual:unsafe-preview");
  expect(output).not.toContain("MoyaForgeReactPreview");
});

test("script source never becomes executable even when CSS is trusted", async () => {
  const registrations = [];
  const source = [
    ":::preview-code[Unsafe]",
    "",
    "<script>",
    'window.__PWNED__ = document.cookie;',
    "</script>",
    "",
    "<p>Example</p>",
    "",
    ":::",
  ].join("\n");
  const output = String(
    await compile(
      { value: source, path: "/docs/unsafe.mdx" },
      createMdxOptions({
        allowInlinePreviewStyles: true,
        componentMappings: {
          "preview-code": {
            component: "PreviewCodeInline",
            sourceProp: "code",
            registerInlineReact(source) {
              registrations.push(source);
              return "virtual:unsafe";
            },
          },
        },
      }),
    ),
  );
  expect(registrations).toEqual([]);
  expect(output).toContain("window.__PWNED__ = document.cookie");
  expect(output).not.toContain("virtual:unsafe");
});

test("external and attributed scripts cannot bypass the source-only policy", async () => {
  for (const open of [
    '<script src="https://evil.example/x.js">',
    '<script onload="alert(1)">',
    "<script>alert(1)</script>",
    "<SCRIPT>",
  ]) {
    await expect(
      compile(
        { value: ":::preview-code[Unsafe]\n\n" + open + "\n\n:::", path: "page.mdx" },
        createMdxOptions({ allowInlinePreviewStyles: true }),
      ),
    ).rejects.toThrow(/standalone, attribute-free/);
  }
});

test("only standalone raw tags within Markdown previews are masked", () => {
  const source = [
    "<style>",
    "body { color: red; }",
    "</style>",
    "",
    "::::preview-code[Source]",
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
        { value: ":::preview-code[Missing]\n<" + tag + ">\nbody { color: red; }\n:::", path: "page.mdx" },
        createMdxOptions(),
      ),
    ).rejects.toThrow("Unclosed <" + tag + ">");
  }
});

test("plain Markdown and React previews keep their existing parsing", async () => {
  const registrations = [];
  const source = [
    ":::preview-code[React]{react}",
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
          "preview-code": {
            component: "PreviewCodeInline",
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

test("custom-admonition examples expose complete authored Markdown, CSS and script in the Code tab", async () => {
  const page = resolve(
    import.meta.dirname,
    "../../../moyaforge-ui/docs/01-components/01-custom-block/40-custom-admonition/page.mdx",
  );
  const document = await readFile(page, "utf8");
  const modules = [];
  const compiled = String(
    await compile(
      { value: document, path: page },
      createMdxOptions({
        allowInlinePreviewStyles: true,
        componentMappings: {
          "preview-code": {
            component: "PreviewCodeInline",
            titleProp: "title",
            sourceProp: "code",
            filesProp: "sourceFiles",
            registerInlineReact(source) {
              modules.push(source);
              return "virtual:preview/" + modules.length;
            },
          },
          "*": { component: "CustomBlock", typeProp: "type", titleProp: "title" },
        },
      }),
    ),
  );
  const codeTabs = [...compiled.matchAll(/\bcode: ("(?:\\.|[^"\\])*")/g)]
    .map((match) => JSON.parse(match[1]))
    .filter((value) => value.startsWith("<style>"));
  const variants = [
    "ui-success",
    "ui-information",
    "ui-warning",
    "ui-error",
    "ui-dark-alert",
    "ui-dismissible",
  ];
  expect(codeTabs).toHaveLength(variants.length);
  expect(modules).toHaveLength(variants.length); // CSS only; scripts are never registered.
  for (const [index, variant] of variants.entries()) {
    const code = codeTabs[index];
    expect(code).toContain("<style>");
    expect(code).toContain("</style>");
    expect(code).toContain("::: " + variant + " ");
    expect(code).toContain("--mf-custom-block-bg");
    expect(code).not.toContain("::::preview-code[");
    expect(code).not.toMatch(/\n::::\s*$/);
  }
  // <summary> must be a direct child of <details>, never inside an
  // auto-generated Markdown paragraph (which causes React hydration errors).
  expect(compiled).toMatch(
    /_jsxs\("details",\s*\{\s*className: "ui-notification-details",\s*children: \[\s*_jsx\("summary",/,
  );
  expect(compiled).not.toMatch(
    /_jsx\("p",\s*\{\s*children: _jsx\("summary",/,
  );
  expect(codeTabs[5]).toContain("<script>");
  expect(codeTabs[5]).toContain("</script>");
  expect(codeTabs[5]).toContain('root.querySelector(".ui-notification-details")');
  expect(modules.join("\n")).not.toContain("root.querySelector");
});

