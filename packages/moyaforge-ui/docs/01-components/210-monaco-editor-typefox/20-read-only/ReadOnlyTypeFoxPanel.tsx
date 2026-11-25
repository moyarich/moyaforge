import { TypeFoxEditorPanel } from "../../../../src/components/TypeFoxEditorPanel/index.js";

export default function ReadOnlyEditor() {
  return (
    <TypeFoxEditorPanel
      readOnly
      height={220}
      files={[
        {
          name: "App.tsx",
          value:
            "export default function App() {\n  return <h1>Read-only example</h1>;\n}\n",
        },
        { name: "styles.css", value: "h1 { color: rebeccapurple; }\n" },
      ]}
    />
  );
}
