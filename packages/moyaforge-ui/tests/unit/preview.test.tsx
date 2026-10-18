import { test, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Preview } from "../../src/components/Preview/Preview.js";

test("Preview renders children without requiring source", () => {
  const html = renderToStaticMarkup(
    createElement(Preview, { title: "Sample" }, createElement("button", null, "Click")),
  );
  expect(html).toContain("Click");
  expect(html).not.toContain("Copy example source");
  expect(html).toContain('data-view="preview"');
});

test("Preview exposes source actions with accessible controls", () => {
  const html = renderToStaticMarkup(
    createElement(Preview, { source: "<button>Demo</button>", defaultView: "code" }, createElement("button", null, "Demo")),
  );
  expect(html).toContain('data-view="code"');
  expect(html).toContain("Copy example source");
  expect(html).toContain("aria-expanded=\"true\"");
  expect(html).toContain("&lt;button&gt;Demo&lt;/button&gt;");
});
