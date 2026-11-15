import { CodePreviewEditor } from "../../../../src/components/CodePreviewEditor/index.js";
import MonacoPreviewExample from "./MonacoPreviewExample.tsx";
import counterSource from "../../CounterExample.tsx?raw";
import counterStyles from "../../counterExample.css?raw";
import workerSource from "../../setup-monaco-worker.ts?raw";

export default function CodePreviewEditorUsage() {
  return (
    <CodePreviewEditor
      title="Monaco source editor"
      files={[
        {
          name: "CounterExample.tsx",
          language: "typescript",
          value: counterSource,
        },
        { name: "counterExample.css", language: "css", value: counterStyles },
        {
          name: "setup-monaco-worker.ts",
          language: "typescript",
          value: workerSource,
          readOnly: true,
        },
      ]}
      height={320}
      renderPreview={(files) => (
        <MonacoPreviewExample
          source={
            files.find((file) => file.name === "CounterExample.tsx")?.value ?? ""
          }
          styles={
            files.find((file) => file.name === "counterExample.css")?.value ?? ""
          }
        />
      )}
    />
  );
}
