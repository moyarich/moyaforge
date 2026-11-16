import { expect, test, vi } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@monaco-editor/react", () => ({
  Editor: ({ value }) => h("textarea", { "data-engine": "react", defaultValue: value }),
}));
vi.mock("@typefox/monaco-editor-react", () => ({
  MonacoEditorReactComp: ({ editorAppConfig }) =>
    h("textarea", {
      "data-engine": "typefox",
      defaultValue: editorAppConfig.codeResources.modified.text,
    }),
}));

import { MonacoEditorReact } from "../../src/components/MonacoEditorReact/MonacoEditorReact.js";
import { MonacoEditorTypeFox } from "../../src/components/MonacoEditorTypeFox/MonacoEditorTypeFox.js";

test("React Monaco and TypeFox can be mounted together in one React tree", () => {
  const html = renderToStaticMarkup(
    h("main", null,
      h(MonacoEditorReact, {
        files: [{ name: "react.tsx", value: "const react = true;" }],
      }),
      h(MonacoEditorTypeFox, {
        files: [{ name: "typefox.tsx", value: "const typefox = true;" }],
      }),
    ),
  );

  expect(html.match(/data-moyaforge-monaco-workspace/g)).toHaveLength(2);
  expect(html).toContain('data-engine="react"');
  expect(html).toContain('data-engine="typefox"');
  expect(html).toContain("const react = true;");
  expect(html).toContain("const typefox = true;");
});
