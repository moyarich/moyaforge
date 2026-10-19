import { expect, test, vi } from "vitest";
import { createElement as h, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock(
  "../../src/components/MonacoEditorReact/ReactMonacoSourceEditor.js",
  () => ({
    ReactMonacoSourceEditor: (props) =>
      h("textarea", {
        "data-model-path": props.path,
        "data-language": props.language,
        readOnly: props.options.readOnly,
        defaultValue: props.value,
      }),
  }),
);
import { MonacoEditorReact } from "../../src/components/MonacoEditorReact/MonacoEditorReact.js";
import { MonacoCodeGroup } from "../../src/components/MonacoEditorReact/MonacoCodeGroup.js";
import { languageForPath } from "../../src/components/MonacoEditorShared/languages.js";
const files = [
  { name: "App.tsx", value: "const app = true;" },
  { name: "locked.json", value: "{}", readOnly: true },
];
test("real editor infers language and enforces workspace, file and options read-only settings", () => {
  const render = (props = {}) =>
    renderToStaticMarkup(h(MonacoEditorReact, { files, ...props }));
  expect(render()).toContain('data-language="typescript"');
  expect(render()).not.toContain('readonly=""');
  expect(render({ readOnly: true })).toContain('readonly=""');
  expect(render({ options: { readOnly: true } })).toContain('readonly=""');
  expect(
    render({ options: { readOnly: true }, readOnly: false }),
  ).not.toContain('readonly=""');
  expect(render({ activeFile: "locked.json" })).toContain('readonly=""');
  expect(render({ activeFile: "locked.json" })).toContain(
    'data-language="json"',
  );
  expect(renderToStaticMarkup(h(MonacoCodeGroup, { files }))).toContain(
    'readonly=""',
  );
  expect(
    renderToStaticMarkup(h(MonacoCodeGroup, { files, editable: true })),
  ).not.toContain('readonly=""');
});
test("separate editor instances isolate identical filenames", () => {
  const html = renderToStaticMarkup(
    h(
      Fragment,
      null,
      h(MonacoEditorReact, { files }),
      h(MonacoEditorReact, { files }),
    ),
  );
  const paths = [...html.matchAll(/data-model-path="([^"]+)"/g)].map(
    (match) => match[1],
  );
  expect(paths).toHaveLength(2);
  expect(paths[0]).not.toBe(paths[1]);
  expect(paths.every((path) => path.endsWith("App.tsx"))).toBe(true);
});
test("language inference handles common extensions, query suffixes and unknown files", () => {
  expect(languageForPath("src/APP.TSX?raw")).toBe("typescript");
  expect(languageForPath("src/main.jsx")).toBe("javascript");
  expect(languageForPath("settings.jsonc")).toBe("json");
  expect(languageForPath("Makefile")).toBe("plaintext");
});

test("explicit host updates replace changed values while preserving other drafts and removing old files", async () => {
  const { reconcileFileDrafts } =
    await import("../../src/components/MonacoEditorShared/drafts.js");
  const previous = new Map([
    ["a.ts", "original a"],
    ["b.ts", "original b"],
    ["removed.ts", "removed"],
  ]);
  const current = {
    "a.ts": "local a",
    "b.ts": "local b",
    "removed.ts": "local removed",
  };
  expect(
    reconcileFileDrafts(current, previous, [
      { name: "a.ts", value: "original a" },
      { name: "b.ts", value: "host update" },
      { name: "new.ts", value: "new" },
    ]),
  ).toEqual({ "a.ts": "local a", "b.ts": "host update", "new.ts": "new" });
});
test("duplicate names and model paths fail instead of sharing editable state", () => {
  expect(() =>
    renderToStaticMarkup(h(MonacoEditorReact, { files: [files[0], files[0]] })),
  ).toThrow(/unique/);
  expect(() =>
    renderToStaticMarkup(
      h(MonacoEditorReact, {
        files: [
          { name: "a.ts", path: "same.ts", value: "a" },
          { name: "b.ts", path: "same.ts", value: "b" },
        ],
      }),
    ),
  ).toThrow(/unique/);
});
