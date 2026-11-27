import { expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CodeRunner } from "../../src/components/CodeRunner/index.js";

test("renders caller-owned output and editor without executing on render", () => {
  const runSource = vi.fn((source: string) => source.length);
  const html = renderToStaticMarkup(
    <CodeRunner
      initialSource="hello"
      runSource={runSource}
      renderEditor={({ source }) => <input aria-label="Custom editor" value={source} readOnly />}
      renderOutput={({ state }) => <div data-output={state.status}>Custom output</div>}
    />,
  );
  expect(html).toContain("Custom editor");
  expect(html).toContain('data-output="idle"');
  expect(html).toContain("Custom output");
  expect(html).toContain("Resize source and output");
  expect(runSource).not.toHaveBeenCalled();
});
