import { expect, test } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Monaco } from "../../src/components/MonacoEditorCore/Monaco.js";

const files = [
  { name: "index.ts", value: "const a = 1;" },
  { name: "styles.css", value: "body {}" },
];

function render(props = {}) {
  return renderToStaticMarkup(
    h(Monaco, {
      files,
      renderEditor: ({ file, value, readOnly }) =>
        h("textarea", { "aria-label": file.name, defaultValue: value, readOnly }),
      ...props,
    }),
  );
}

test("Monaco core renders the selected file without owning UI chrome", () => {
  const html = render({ activeFile: "styles.css", className: "custom-editor" });
  expect(html).toContain('class="mf-monaco-runtime custom-editor"');
  expect(html).toContain('aria-label="styles.css"');
  expect(html).toContain("body {}");
  expect(html).not.toContain('role="tablist"');
  expect(html).not.toContain('data-moyaforge-monaco-toolbar');
});

test("Monaco core respects file locks and empty workspaces", () => {
  expect(render({ readOnly: true })).toContain('readOnly=""');
  expect(render({ files: [{ name: "private.ts", value: "", readOnly: true }] })).toContain('readOnly=""');
  expect(render({ files: [] })).toBe("");
});
