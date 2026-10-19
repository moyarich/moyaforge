import { expect, test } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Monaco } from "../../src/components/MonacoEditorShared/Monaco.js";
const files = [
  { name: "index.ts", value: "const a = 1;" },
  { name: "styles.css", value: "body {}" },
];
function render(props = {}) {
  return renderToStaticMarkup(
    h(Monaco, {
      files,
      renderEditor: ({ file, value }) =>
        h("textarea", { "aria-label": file.name, defaultValue: value }),
      ...props,
    }),
  );
}
test("file tabs expose a labeled panel, roving selection and active-file copying", () => {
  const html = render({ defaultActiveFile: "styles.css" });
  expect(html).toContain('aria-label="Copy styles.css"');
  expect(html).toContain('role="tabpanel"');
  expect(html).toContain("aria-labelledby=");
  expect(html).toContain("aria-controls=");
  expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  expect(html).toContain('aria-selected="true"');
  expect(html).toContain("lucide-file-code-2");
});
test("minimal and controlled configurations retain their supplied file and toolbar choices", () => {
  const html = render({
    activeFile: "styles.css",
    showFileTabs: false,
    showCopyButton: false,
    className: "custom-editor",
  });
  expect(html).not.toContain('role="tablist"');
  expect(html).not.toContain('role="tabpanel"');
  expect(html).not.toContain("data-moyaforge-monaco-toolbar");
  expect(html).toContain('class="custom-editor"');
  expect(html).toContain("body {}");
  expect(render({ files: [] })).toBe("");
});
