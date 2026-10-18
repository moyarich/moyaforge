import "./MonacoPreviewExample.css";
import {
  Preview,
  PreviewHeader,
  PreviewTitle,
  PreviewActions,
  PreviewCodeToggle,
  PreviewCopyButton,
  PreviewContent,
  PreviewSource,
} from "../../../src/components/Preview/index.js";
import { Monaco } from "../../../src/components/Monaco/Monaco.js";
import CounterExample from "./CounterExample.js";
import counterSource from "./CounterExample.tsx?raw";
import exampleCSS from "./PreviewExample.css?raw";

/** Monaco is optional: only this example imports its editor implementation. */
export default function MonacoPreviewExample() {
  const files = [
    {
      name: "CounterExample.tsx",
      language: "typescript",
      value: counterSource,
    },
    { name: "PreviewExample.css", language: "css", value: exampleCSS },
  ];
  return (
    <Preview source={counterSource}>
      <PreviewHeader>
        <PreviewTitle>Monaco source editor</PreviewTitle>
        <PreviewActions>
          <PreviewCodeToggle asChild>
            <button type="button" className="mf-monaco-preview-toggle">
              Toggle editor
            </button>
          </PreviewCodeToggle>
          <PreviewCopyButton />
        </PreviewActions>
      </PreviewHeader>
      <PreviewContent asChild>
        <div className="mf-monaco-preview-stage">
          <CounterExample />
        </div>
      </PreviewContent>
      <PreviewSource asChild>
        <div className="mf-monaco-preview-editor">
          <Monaco
            files={files}
            renderEditor={({ file, value, onChange }) => (
              <textarea
                aria-label={file.name}
                rows={12}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                style={{ width: "100%" }}
              />
            )}
          />
        </div>
      </PreviewSource>
    </Preview>
  );
}
