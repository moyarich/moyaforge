import { expect, test } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
  ).toContain("@/components/ui/components/CopyButton/index");
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
