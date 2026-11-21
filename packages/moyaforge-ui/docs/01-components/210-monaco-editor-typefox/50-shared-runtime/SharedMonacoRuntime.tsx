import { MonacoEditorWorkspace } from "../../../../src/components/MonacoEditorWorkspace/index.js";
import { TypeFoxEditorWorkspace } from "../../../../src/components/TypeFoxEditorWorkspace/index.js";

const reactFiles = [
  { name: "react.tsx", value: "export const reactEditor = true;" },
];
const typefoxFiles = [
  { name: "typefox.tsx", value: "export const typefoxEditor = true;" },
];

export default function SharedMonacoExample() {
  // Shared services are initialized by the playground in main.tsx.
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section aria-label="React Monaco editor">
        <h3>React Monaco</h3>
        <MonacoEditorWorkspace files={reactFiles} height={220} />
      </section>
      <section aria-label="TypeFox Monaco editor">
        <h3>TypeFox</h3>
        <TypeFoxEditorWorkspace files={typefoxFiles} height={220} />
      </section>
    </div>
  );
}
