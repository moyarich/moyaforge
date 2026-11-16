import React, { useEffect, useState } from "react";
import { initializeSharedMonaco } from "@moyarich/moyaforge-monaco/shared";
import { MonacoEditorReact } from "../../packages/moyaforge-ui/src/components/MonacoEditorReact/MonacoEditorReact.js";
import { MonacoEditorTypeFox } from "../../packages/moyaforge-ui/src/components/MonacoEditorTypeFox/MonacoEditorTypeFox.js";

const reactFiles = [
  { name: "ReactView.tsx", value: "export const ReactView = () => <span>React Monaco ready</span>;" },
  { name: "styles.css", value: "body { color: royalblue; }" },
];
const typefoxFiles = [
  { name: "TypeFoxView.tsx", value: "export const TypeFoxView = () => <span>TypeFox Monaco ready</span>;" },
  { name: "settings.json", value: '{ "enabled": true }' },
];

/** Real browser fixture: a single VS Code-compatible runtime, two editor engines. */
export default function SharedMonacoFixture() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState("");
  const [reactReady, setReactReady] = useState(false);
  const [typefoxReady, setTypefoxReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void initializeSharedMonaco().then(
      () => { if (mounted) setInitialized(true); },
      (reason) => {
        if (mounted) setError(reason instanceof Error ? reason.message : String(reason));
      },
    );
    return () => { mounted = false; };
  }, []);

  return (
    <main>
      <h1>Shared Monaco browser fixture</h1>
      {error && <p role="alert">{error}</p>}
      {!initialized && !error && <p role="status">Initializing Monaco services…</p>}
      {initialized && (
        <div style={{ display: "grid", gap: 24, maxWidth: 960 }}>
          <section data-testid="react-editor" aria-label="React Monaco editor">
            <h2>React Monaco</h2>
            <output data-testid="react-ready">{reactReady ? "ready" : "loading"}</output>
            <MonacoEditorReact
              files={reactFiles}
              height={260}
              onMount={() => setReactReady(true)}
            />
          </section>
          <section data-testid="typefox-editor" aria-label="TypeFox Monaco editor">
            <h2>TypeFox Monaco</h2>
            <output data-testid="typefox-ready">{typefoxReady ? "ready" : "loading"}</output>
            <MonacoEditorTypeFox
              files={typefoxFiles}
              height={260}
              onReady={() => setTypefoxReady(true)}
              onError={(reason) => setError(reason instanceof Error ? reason.message : String(reason))}
            />
          </section>
        </div>
      )}
    </main>
  );
}
