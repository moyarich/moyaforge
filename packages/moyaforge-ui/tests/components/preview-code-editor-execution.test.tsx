import { expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PreviewCodeEditor } from "../../src/components/PreviewCodeEditor/index.js";

vi.mock("../../src/components/MonacoEditorPanel/index.js", () => ({
  MonacoEditorPanel: () => <div>Mock editor</div>,
}));

const files = [{ name: "input.json", language: "json", value: "{}" }];

test("explicit mode exposes a custom output renderer without running on mount", () => {
  const runSource = vi.fn(() => 42);
  const html = renderToStaticMarkup(
    <PreviewCodeEditor title="Parser" files={files} runSource={runSource}
      renderOutput={({ state }) => <div>Output: {state.status}</div>} />,
  );
  expect(html).toContain("Mock editor");
  expect(html).toContain("Output: idle");
  expect(html).toContain("Resize source and output");
  expect(html).toContain("Clear output");
  expect(runSource).not.toHaveBeenCalled();
});

test("existing live preview remains available", () => {
  const html = renderToStaticMarkup(
    <PreviewCodeEditor title="Live" files={files}
      renderPreview={current => <div>Live: {current[0]?.value}</div>} />,
  );
  expect(html).toContain("Live: {}");
  expect(html).not.toContain("Clear output");
});

 test("live preview offers a collapsed configurable console without discarding its renderer", () => {
  const html = renderToStaticMarkup(
    <PreviewCodeEditor title="Live" files={files}
      renderPreview={() => <button>Counter</button>}
      renderOutput={() => <div>Captured logs</div>}
      outputLabel="Console" defaultOutputOpen={false} />,
  );
  expect(html).toContain("Show Console");
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain("Captured logs");
  expect(html).toContain('aria-label="Console" hidden=""');
});
