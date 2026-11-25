import { expect, test } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MonacoFileSession } from "../../src/components/MonacoFileSession/MonacoFileSession.js";

const files = [
  { name: "index.ts", value: "const a = 1;" },
  { name: "styles.css", value: "body {}" },
];

function render(props = {}) {
  return renderToStaticMarkup(
    h(MonacoFileSession, {
      files,
      renderEditor: ({ file, value, readOnly }) =>
        h("textarea", { "aria-label": file.name, defaultValue: value, readOnly }),
      ...props,
    }),
  );
}

test("Monaco file session renders the selected file without owning UI chrome", () => {
  const html = render({ activeFile: "styles.css", className: "custom-editor" });
  expect(html).toContain('class="mf-monaco-runtime custom-editor"');
  expect(html).toContain('aria-label="styles.css"');
  expect(html).toContain("body {}");
  expect(html).not.toContain('role="tablist"');
  expect(html).not.toContain('data-moyaforge-monaco-toolbar');
});

test("Monaco file session respects file locks and empty workspaces", () => {
  expect(render({ readOnly: true })).toContain('readOnly=""');
  expect(render({ files: [{ name: "private.ts", value: "", readOnly: true }] })).toContain('readOnly=""');
  expect(render({ files: [] })).toBe("");
});
