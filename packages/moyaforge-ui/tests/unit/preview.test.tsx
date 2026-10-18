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

test("asChild composes toggle semantics without nesting buttons", () => {
  const html = renderToStaticMarkup(
    h(
      Preview,
      { source: "const x = 1" },
      h(
        PreviewHeader,
        null,
        h(
          PreviewActions,
          null,
          h(
            PreviewCodeToggle,
            { asChild: true },
            h(
              "button",
              { className: "custom-trigger", type: "button" },
              "Show code",
            ),
          ),
        ),
      ),
      h(PreviewContent, null, "Live"),
      h(PreviewSource, { code: "const x = 1" }),
    ),
  );
  expect(html).toContain('class="custom-trigger"');
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain("Show code");
  expect(html).not.toContain("<button><button");
});

test("asChild rejects noninteractive intrinsic elements", () => {
  expect(() =>
    renderToStaticMarkup(
      h(
        Preview,
        null,
        h(PreviewCodeToggle, { asChild: true }, h("div", null, "Not a button")),
      ),
    ),
  ).toThrow(/button or button-like/);
});

test("asChild content uses its child as the stage without wrapping it", () => {
  const html = renderToStaticMarkup(
    h(
      Preview,
      null,
      h(
        PreviewContent,
        { asChild: true },
        h("article", { className: "consumer-stage" }, "Parser form"),
      ),
    ),
  );
  expect(html).toContain('data-moyaforge-preview-content=""');
  expect(html).toContain('class="consumer-stage"');
  expect(html).toContain("<article");
  expect(html).not.toContain('data-moyaforge-preview-stage=""');
});
test("asChild source supports arbitrary DOM-forwarding editors", () => {
  const html = renderToStaticMarkup(
    h(
      Preview,
      { defaultView: "code", source: "#06c" },
      h(PreviewContent, null, "Color preview"),
      h(
        PreviewSource,
        { asChild: true },
        h("div", { "aria-label": "Color source editor" }, "Editor"),
      ),
    ),
  );
  expect(html).toContain('data-moyaforge-preview-source=""');
  expect(html).toContain('aria-label="Color source editor"');
  expect(html).toContain("Editor");
});
test("asChild source requires a single element", () => {
  expect(() =>
    renderToStaticMarkup(
      h(Preview, null, h(PreviewSource, { asChild: true }, "text")),
    ),
  ).toThrow(/exactly one/);
});
