import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { CodeBlock } from "../../src/components/CodeBlock/CodeBlock.js";
import { CodeGroup, CodeTab } from "../../src/components/CodeGroup/CodeGroup.js";
import { CopyButton } from "../../src/components/CopyButton/CopyButton.js";
import { HighlightedCode } from "../../src/components/HighlightedCode/HighlightedCode.js";

test("code display classes preserve metadata and accessible tab state", () => {
  const block = renderToStaticMarkup(
    h(CodeBlock, { language: "tsx", "data-filename": "Example.tsx" },
      h("code", null, "const value = 1;")),
  );
  expect(block).toContain('class="mf-code-block"');
  expect(block).toContain('data-moyaforge-code-block=""'); // Browser consumer depends on this marker.
  expect(block).toContain('class="mf-code-filename"');
  expect(block).toContain('class="mf-code-language"');
  expect(block).toContain('mf-copy-button--idle');

  const group = renderToStaticMarkup(
    h(CodeGroup, null, h(CodeTab, { label: "One" }, h("pre", null, "one"))),
  );
  expect(group).toContain('class="mf-code-group"');
  expect(group).toContain('class="mf-code-tab mf-code-tab--active"');
  expect(group).toContain('aria-selected="true"');
  expect(group).toContain('class="mf-code-panel"');

  const copy = renderToStaticMarkup(h(CopyButton, { className: "custom-copy", value: "x" }));
  expect(copy).toContain('mf-copy-button--idle');
  expect(copy).toContain('custom-copy');
  expect(copy).not.toContain('data-copy-status');

  const highlighted = renderToStaticMarkup(h(HighlightedCode, { code: "let x = 1;", language: "ts" }));
  expect(highlighted).toContain('class="mf-highlighted-code"');
  expect(highlighted).toContain('data-moyaforge-highlighted-code=""'); // Existing tests depend on this marker.
});

test("code display styles use classes and MoyaForge token namespaces", async () => {
  const stylesheets = [
    "CodeBlock/CodeBlock.css",
    "CodeGroup/CodeGroup.css",
    "CopyButton/CopyButton.css",
    "HighlightedCode/HighlightedCode.css",
    "Preview/PreviewCopyButton.css",
    "Preview/PreviewSource.css",
  ];
  for (const relative of stylesheets) {
    const css = await readFile(
      resolve(import.meta.dirname, "../../src/components", relative),
      "utf8",
    );
    expect(css, relative).not.toContain("[data-");
    expect(css, relative).not.toMatch(/--(?:_code-|_copy-button-|code-block-|code-group-|copy-button-|preview-syntax-color)/);
  }
});
