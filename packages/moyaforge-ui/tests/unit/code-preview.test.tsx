import { expect, test } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { InlineCodePreview } from "../../src/components/CodePreview/InlineCodePreview.js";
import { HighlightedCode } from "../../src/components/HighlightedCode/HighlightedCode.js";
import {
  CodePreview,
  CODE_REPLACEMENTS,
  applyReplacements,
} from "../../src/components/CodePreview/CodePreview.js";
test("shared code preview composes live children and multiple source files", () => {
  const html = renderToStaticMarkup(
    h(CodePreview, {
      title: "Example",
      files: [
        { label: "Example.tsx", code: "export const a = 1;" },
        { label: "Example.css", code: ".demo { display: grid; }" },
      ],
      children: h("button", null, "Live demo"),
    }),
  );
  expect(html).toContain("Live demo");
  expect(html).toContain('role="tablist"');
  expect(html).toContain("Example.tsx");
  expect(html).toContain("Example.css");
  expect(html).toContain("Copy example source");
});
test("single file uses the standard source slot without a redundant tab group", () => {
  const html = renderToStaticMarkup(
    h(CodePreview, {
      title: "Single",
      files: [{ label: "Example.tsx", code: "const x = 1;" }],
      children: "Preview",
    }),
  );
  expect(html).not.toContain('role="tablist"');
  expect(html).toContain("data-moyaforge-preview-source");
  expect(html.replace(/<[^>]*>/g, "")).toContain("const x = 1;");
  expect(html).toContain("--shiki-light:");
  expect(html).toContain("--shiki-dark:");
});
test("replacement rules are explicit, generic across component names and support custom substitutions", () => {
  expect(
    applyReplacements(
      'import "../../src/components/CopyButton/index.js";',
      CODE_REPLACEMENTS,
    ),
  ).toContain("@/components/ui/CopyButton/index");
  expect(applyReplacements('import "../setup";', CODE_REPLACEMENTS)).toBe(
    'import "./setup";',
  );
  expect(applyReplacements("a a", [["a", "b"]])).toBe("b b");
  expect(applyReplacements("a a", [[/a/, "b"]])).toBe("b a");
  expect(applyReplacements("untouched", [])).toBe("untouched");
});
test("empty files and duplicate labels fail clearly", () => {
  expect(() =>
    renderToStaticMarkup(
      h(CodePreview, { title: "Empty", files: [], children: null }),
    ),
  ).toThrow(/at least one/);
  expect(() =>
    renderToStaticMarkup(
      h(CodePreview, {
        title: "Duplicate",
        files: [
          { label: "a", code: "a" },
          { label: "a", code: "b" },
        ],
        children: null,
      }),
    ),
  ).toThrow(/unique/);
});

test("file languages can be overridden and unknown languages remain safely escaped text", () => {
  const highlight = (file) =>
    renderToStaticMarkup(
      h(CodePreview, { title: "Language", files: [file], children: "Demo" }),
    );
  expect(
    highlight({
      label: "snippet",
      language: "css",
      code: ".demo { color: red; }",
    }),
  ).toContain("data-moyaforge-highlighted-code");
  const plain = highlight({
    label: "example.unknown",
    code: '<script>alert("source")</script>',
  });
  expect(plain).not.toContain("data-moyaforge-highlighted-code");
  expect(plain).toContain("&lt;script&gt;");
});


test("inline callout preview Code tab displays Markdown, CSS and source-only script", () => {
  const source = [
    "<style>",
    ".custom-block.ui-success { --mf-custom-block-bg: #e9f9f1; }",
    "</style>",
    "",
    "::: ui-success Changes saved",
    "",
    "Your changes are saved.",
    "",
    ":::",
    "",
    "<script>",
    'window.__shouldNeverRun = true;',
    "</script>",
  ].join("\n");
  const html = renderToStaticMarkup(
    h(InlineCodePreview, {
      title: "Success alert",
      code: source,
      children: h("p", null, "Your changes are saved."),
    }),
  );

  // The source panel is hidden until the Code button is clicked, but its
  // contents must already be rendered in the DOM as escaped source text.
  const sourcePanel = html.match(
    /<pre[^>]*data-moyaforge-preview-source=""[^>]*>([\s\S]*?)<\/pre>/,
  )?.[1];
  expect(sourcePanel).toBeDefined();
  const sourceText = (sourcePanel ?? "")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
  expect(sourceText).toContain("<style>");
  expect(sourceText).toContain("--mf-custom-block-bg: #e9f9f1");
  expect(sourceText).toContain("::: ui-success Changes saved");
  expect(sourceText).toContain("<script>");
  expect(sourceText).toContain("window.__shouldNeverRun = true;");
  expect(html).not.toContain("<script>");
});


test("MDX source tabs highlight raw style and script bodies using their language grammars", () => {
  const calls: { lang: string; code: string }[] = [];
  const highlighter = {
    getLoadedLanguages: () => ["mdx", "markdown", "css", "javascript"],
    codeToTokens: (code: string, options: { lang: string }) => {
      calls.push({ lang: options.lang, code });
      return {
        tokens: code.split(/\r\n|\r|\n/).map((line) => [
          {
            content: line,
            htmlStyle: { color: options.lang === "css" ? "#123456" : "#654321" },
          },
        ]),
      };
    },
  } as unknown as NonNullable<Parameters<typeof HighlightedCode>[0]["highlighter"]>;

  const code = [
    "<style>",
    ".custom-block.ui-success {",
    "  --mf-custom-block-bg: #e9f9f1;",
    "}",
    "</style>",
    "",
    "::: ui-success Changes saved",
    "",
    "Your changes were saved.",
    "",
    ":::",
    "",
    "<script>",
    'console.log("Source only");',
    "</script>",
  ].join("\r\n");
  const html = renderToStaticMarkup(
    h(HighlightedCode, { code, language: "mdx", highlighter }),
  );
  expect(calls.map(({ lang }) => lang)).toEqual([
    "mdx", "css", "mdx", "javascript", "mdx",
  ]);
  expect(calls[1].code).toContain("--mf-custom-block-bg");
  expect(calls[3].code).toContain('console.log("Source only");');
  expect(html).toContain("--shiki-light:#123456");
  expect(html).toContain("color:var(--mf-preview-syntax-color");
  expect(
    html.replace(/<[^>]+>/g, "")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&amp;", "&"),
  ).toBe(code);
});

test("ordinary CSS files keep the CSS grammar without Markdown segmentation", () => {
  const languages: string[] = [];
  const highlighter = {
    getLoadedLanguages: () => ["css"],
    codeToTokens: (code: string, options: { lang: string }) => {
      languages.push(options.lang);
      return { tokens: [[{ content: code, htmlStyle: { color: "#123456" } }]] };
    },
  } as unknown as NonNullable<Parameters<typeof HighlightedCode>[0]["highlighter"]>;

  const code = "<style>\n.foo { color: red; }\n</style>";
  renderToStaticMarkup(h(HighlightedCode, { code, language: "css", highlighter }));
  expect(languages).toEqual(["css"]);
});


test("real Shiki highlighter assigns distinct CSS token colors inside MDX style blocks", () => {
  const source = [
    "<style>",
    ".custom-block.ui-success {",
    "  --mf-custom-block-bg: #e9f9f1;",
    "  background-color: red;",
    "}",
    "</style>",
  ].join("\n");
  const html = renderToStaticMarkup(h(HighlightedCode, { code: source, language: "mdx" }));
  const cssSegment = html.split(".custom-block")[1]?.split("&lt;/style&gt;")[0] ?? "";
  const colors = new Set(
    [...cssSegment.matchAll(/--shiki-light:([^;"]+)/g)].map((match) => match[1]),
  );
  expect(colors.size).toBeGreaterThan(1);
  expect(html).toContain("color");
  expect(html).toContain("&lt;style&gt;");
});
