import { expect, test, vi } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("@typefox/monaco-editor-react", () => ({
  MonacoEditorReactComp: ({ editorAppConfig }) =>
    h("textarea", {
      readOnly: editorAppConfig.editorOptions.readOnly,
      defaultValue: editorAppConfig.codeResources.modified.text,
      "data-language": editorAppConfig.codeResources.modified.enforceLanguageId,
      "data-uri": editorAppConfig.codeResources.modified.uri,
    }),
}));
import { MonacoEditorTypeFox } from "../../src/components/MonacoEditorTypeFox/MonacoEditorTypeFox.js";
const files = [
  { name: "App.tsx", value: "const app = true;" },
  { name: "package.json", value: "{}", readOnly: true },
];
test("TypeFox uses workspace drafts, inferred languages and file locks", () => {
  const render = (props = {}) =>
    renderToStaticMarkup(h(MonacoEditorTypeFox, { files, ...props }));
  expect(render()).toContain('data-language="typescript"');
  expect(render()).not.toContain('readonly=""');
  expect(render({ readOnly: true })).toContain('readonly=""');
  expect(render({ options: { readOnly: true } })).toContain('readonly=""');
  expect(
    render({ options: { readOnly: true }, readOnly: false }),
  ).not.toContain('readonly=""');
  expect(render({ activeFile: "package.json" })).toContain('readonly=""');
});
test("TypeFox rejects ambiguous model paths", () => {
  expect(() =>
    renderToStaticMarkup(
      h(MonacoEditorTypeFox, {
        files: [
          { name: "a", path: "x.ts", value: "" },
          { name: "b", path: "x.ts", value: "" },
        ],
      }),
    ),
  ).toThrow("model paths must be unique");
});
