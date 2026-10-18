import { test, expect } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Preview,
  PreviewHeader,
  PreviewTitle,
  PreviewActions,
  PreviewCodeToggle,
  PreviewCopyButton,
  PreviewContent,
  PreviewSource,
  PreviewFooter,
} from "../../src/components/Preview/index.js";

test("shorthand Preview renders live content and optional source actions", () => {
  const html = renderToStaticMarkup(
    h(
      Preview,
      { title: "Sample", source: "<b>Hello</b>" },
      h("button", null, "Click"),
    ),
  );
  expect(html).toContain("Click");
  expect(html).toContain("Copy example source");
  expect(html).toContain('data-view="preview"');
});
test("Preview renders separately composed slots and code by default", () => {
  const html = renderToStaticMarkup(
    h(
      Preview,
      { source: "const a = 1", defaultView: "code" },
      h(
        PreviewHeader,
        null,
        h(PreviewTitle, null, "Sample"),
        h(PreviewActions, null, h(PreviewCodeToggle), h(PreviewCopyButton)),
      ),
      h(PreviewContent, null, h("button", null, "Hidden while code is shown")),
      h(PreviewSource, { code: "const a = 1" }),
      h(PreviewFooter, null, "Footer"),
    ),
  );
  expect(html).toContain('data-view="code"');
  expect(html).toContain('aria-expanded="true"');
  expect(html).toContain("const a = 1");
  expect(html).toContain("Footer");
  expect(html).toContain('hidden=""');
});
test("Preview supports minimal custom slots without automatic toolbar", () => {
  const html = renderToStaticMarkup(
    h(Preview, null, h(PreviewContent, null, "Only stage")),
  );
  expect(html).toContain("Only stage");
  expect(html).not.toContain("data-moyaforge-preview-toolbar");
});
