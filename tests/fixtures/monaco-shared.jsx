import React, { useState } from "react";
import { MonacoEditorPanel } from "../../packages/moyaforge-ui/src/components/MonacoEditorPanel/index.ts";
import { TypeFoxEditorPanel } from "../../packages/moyaforge-ui/src/components/TypeFoxEditorPanel/index.ts";

const reactFiles = [
  {
    name: "ReactView.tsx",
    value: "export const ReactView = () => <span>React Monaco ready</span>;",
  },
  { name: "styles.css", value: "body { color: royalblue; }" },
];
const typefoxFiles = [
  {
    name: "TypeFoxView.tsx",
    value:
      "export const TypeFoxView = () => <span>TypeFox Monaco ready</span>;",
  },
  { name: "settings.json", value: '{ "enabled": true }' },
];

/** The route initializes shared services before mounting these real editors. */
export default function SharedMonacoFixture() {
  const [error, setError] = useState("");
  const [reactReady, setReactReady] = useState(false);
  const [typefoxReady, setTypefoxReady] = useState(false);

  return (
    <main>
      <h1>Shared Monaco browser fixture</h1>
      {error && <p role="alert">{error}</p>}
      <div style={{ display: "grid", gap: 24, maxWidth: 960 }}>
        <section data-testid="react-editor" aria-label="React Monaco editor">
          <h2>React Monaco</h2>
          <output data-testid="react-ready">
            {reactReady ? "ready" : "loading"}
          </output>
          <MonacoEditorPanel
            files={reactFiles}
            height={260}
            onMount={() => setReactReady(true)}
          />
        </section>
        <section
          data-testid="typefox-editor"
          aria-label="TypeFox Monaco editor"
        >
          <h2>TypeFox Monaco</h2>
          <output data-testid="typefox-ready">
            {typefoxReady ? "ready" : "loading"}
          </output>
          <TypeFoxEditorPanel
            files={typefoxFiles}
            height={260}
            onReady={() => setTypefoxReady(true)}
            onError={(reason) =>
              setError(reason instanceof Error ? reason.message : String(reason))
            }
          />
        </section>
      </div>
    </main>
  );
}
