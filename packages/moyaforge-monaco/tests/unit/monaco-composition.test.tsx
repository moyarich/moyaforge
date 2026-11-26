import { expect, test, vi } from "vitest";

const typefoxPropsSpy = vi.hoisted(() => vi.fn());
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@monaco-editor/react", () => ({
  Editor: ({ value }) => h("textarea", { "data-engine": "react", defaultValue: value }),
}));
vi.mock("@typefox/monaco-editor-react", () => ({
  MonacoEditorReactComp: (props) => {
    typefoxPropsSpy(props);
    return h("textarea", {
      "data-engine": "typefox",
      defaultValue: props.editorAppConfig.codeResources.modified.text,
    });
  },
}));

import { MonacoEditorReact } from "../../src/components/MonacoEditorReact/MonacoEditorReact.js";
import {
  MonacoEditorTypeFox,
  type MonacoEditorTypeFoxProps,
} from "../../src/components/MonacoEditorTypeFox/MonacoEditorTypeFox.js";

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


test("TypeFox forwards the language-client config unchanged to the underlying editor", () => {
  typefoxPropsSpy.mockClear();
  const languageClientConfig = {
    languageId: "example-language",
  } as MonacoEditorTypeFoxProps["languageClientConfig"];
  const html = renderToStaticMarkup(
    h(MonacoEditorTypeFox, {
      files: [{ name: "example.language", value: "hello" }],
      languageClientConfig,
    }),
  );

  expect(html).toContain('data-engine="typefox"');
  expect(typefoxPropsSpy).toHaveBeenCalledTimes(1);
  expect(typefoxPropsSpy.mock.calls[0][0].languageClientConfig).toBe(
    languageClientConfig,
  );
});


test("TypeFox forwards native lifecycle, logging and editor configuration", () => {
  typefoxPropsSpy.mockClear();
  const onVscodeApiInitDone = vi.fn();
  const onLanguageClientsStartDone = vi.fn();
  const onEditorStartDone = vi.fn();
  const onTextChanged = vi.fn();
  const onDisposeEditor = vi.fn();
  renderToStaticMarkup(h(MonacoEditorTypeFox, {
    files: [{ name: "example.ts", value: "const x = 1;", readOnly: true }],
    onVscodeApiInitDone,
    onLanguageClientsStartDone,
    onEditorStartDone,
    onTextChanged,
    onDisposeEditor,
    logLevel: 2,
    editorAppConfig: { editorOptions: { fontSize: 18, readOnly: false } },
  }));
  const native = typefoxPropsSpy.mock.calls[0][0];
  expect(native.onVscodeApiInitDone).toBe(onVscodeApiInitDone);
  expect(native.onLanguageClientsStartDone).toBe(onLanguageClientsStartDone);
  expect(native.onDisposeEditor).toBe(onDisposeEditor);
  expect(native.logLevel).toBe(2);
  expect(native.editorAppConfig.editorOptions.fontSize).toBe(18);
  expect(native.editorAppConfig.editorOptions.readOnly).toBe(true);
  expect(native.editorAppConfig.codeResources.modified.text).toBe("const x = 1;");
});
