import { expect, test } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EditorWorkspace } from "../../src/components/EditorWorkspace/EditorWorkspace.js";

const files = [
  { name: "App.tsx", path: "src/App.tsx", value: "const app = 1;" },
  { name: "styles.css", value: "body {}" },
];

test("editor workspace owns the tabs, panel and toolbar independently of Monaco", () => {
  const html = renderToStaticMarkup(h(EditorWorkspace, {
    files,
    showBreadcrumbs: true,
    onSave: () => {},
    renderEditor: ({ activeFile }) => h("textarea", { defaultValue: activeFile.value }),
  }));
  expect(html).toContain('role="tablist"');
  expect(html).toContain('role="tab"');
  expect(html).toContain('role="tabpanel"');
  expect(html).toContain('aria-selected="true"');
  expect(html).toContain("App.tsx");
  expect(html).toContain("src");
  expect(html).toContain("Save");
  expect(html).toContain("Copy");
  expect(html).not.toContain("data-moyaforge-monaco");
});

test("workspace file selection and locking are host controlled", () => {
  const html = renderToStaticMarkup(h(EditorWorkspace, {
    files,
    activeFile: "styles.css",
    readOnly: true,
    onSave: () => {},
    renderEditor: ({ activeFile, readOnly }) => h("textarea", {
      defaultValue: activeFile.value,
      readOnly,
    }),
  }));
  expect(html).toContain("body {}");
  expect(html).toContain("Read only");
  expect(html).toContain('readOnly=""');
  expect(html).toContain('disabled=""');
});
