import { useEffect, useState } from "react";
import { initializeSharedMonaco } from "@moyarich/moyaforge-monaco/shared";
import { MonacoEditorReact } from "../../../../src/components/MonacoEditorReact/index.js";
import { MonacoEditorTypeFox } from "../../../../src/components/MonacoEditorTypeFox/index.js";

const reactFiles = [{ name: "react.tsx", value: "export const reactEditor = true;" }];
const typefoxFiles = [{ name: "typefox.tsx", value: "export const typefoxEditor = true;" }];

export default function SharedMonacoExample() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let mounted = true;
    void initializeSharedMonaco().then(
      () => { if (mounted) setReady(true); },
      (reason: unknown) => {
        if (mounted) setError(reason instanceof Error ? reason.message : String(reason));
      },
    );
    return () => { mounted = false; };
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!ready) return <p role="status">Initializing shared Monaco services…</p>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section aria-label="React Monaco editor">
        <h3>React Monaco</h3>
        <MonacoEditorReact files={reactFiles} height={220} />
      </section>
      <section aria-label="TypeFox Monaco editor">
        <h3>TypeFox</h3>
        <MonacoEditorTypeFox files={typefoxFiles} height={220} />
      </section>
    </div>
  );
}
