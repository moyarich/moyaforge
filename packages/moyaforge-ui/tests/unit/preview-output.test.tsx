import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Preview, PreviewContent, PreviewOutput, PreviewOutputToggle, PreviewHeader, PreviewActions } from "../../src/components/Preview/index.js";
import { PreviewCode } from "../../src/components/PreviewCode/index.js";
import { PreviewInteractive } from "../../src/components/PreviewInteractive/index.js";

test("shared output has its own accessible toggle and stays mounted when collapsed", () => {
  const html = renderToStaticMarkup(
    <Preview defaultView="code" outputLabel="Console" defaultOutputOpen={false}>
      <PreviewHeader><PreviewActions><PreviewOutputToggle /></PreviewActions></PreviewHeader>
      <PreviewContent>Result</PreviewContent>
      <PreviewOutput>Retained messages</PreviewOutput>
    </Preview>,
  );
  const target = html.match(/aria-controls="([^"]+)"/)?.[1];
  expect(target).toBeTruthy();
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain("Show Console");
  expect(html).toContain('id="' + target + '"');
  expect(html).toContain('aria-label="Console" hidden=""');
  expect(html).toContain("Retained messages");
});

test("shorthand preview exposes optional output without source", () => {
  const html = renderToStaticMarkup(<Preview output="Diagnostics">Result</Preview>);
  expect(html).toContain("Hide Output");
  expect(html).toContain("Diagnostics");
});

test("code and interactive previews reuse output slots without an editor", () => {
  const output = <span>Captured logs</span>;
  for (const element of [
    <PreviewCode title="Code" files={[{label:"a.js",code:"const a = 1"}]} output={output} defaultOutputOpen={false}>Result</PreviewCode>,
    <PreviewInteractive title="Interactive" files={{"a.js":"const a = 1"}} controls={<button>Control</button>} output={output} defaultOutputOpen={false}>Result</PreviewInteractive>,
  ]) {
    const html = renderToStaticMarkup(element);
    expect(html).toContain("Show Output");
    expect(html).toContain("Captured logs");
    expect(html).toContain("data-moyaforge-preview-output");
  }
});
