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
const files = [
  { name: "App.tsx", value: "const app = true;" },
  { name: "locked.json", value: "{}", readOnly: true },
];
test("real editor delegates language inference and enforces workspace, file and options read-only settings", () => {
  const render = (props = {}) =>
    renderToStaticMarkup(h(MonacoEditorReact, { files, ...props }));
  expect(render()).not.toContain('data-language=');
  expect(render({ files: [{ name: "example.txt", value: "", language: "typescript" }] })).toContain('data-language="typescript"');
  expect(render()).not.toContain('readOnly=""');
  expect(render({ readOnly: true })).toContain('readOnly=""');
  expect(render({ options: { readOnly: true } })).toContain('readOnly=""');
  expect(
    render({ options: { readOnly: true }, readOnly: false }),
  ).not.toContain('readOnly=""');
  expect(render({ activeFile: "locked.json" })).toContain('readOnly=""');
  expect(render({ activeFile: "locked.json" })).not.toContain('data-language=');
  expect(render()).not.toContain('role="tablist"');
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

test("explicit host updates replace changed values while preserving other drafts and removing old files", async () => {
  const { reconcileFileDrafts } =
    await import("../../src/models/reconcileFileDrafts.js");
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
