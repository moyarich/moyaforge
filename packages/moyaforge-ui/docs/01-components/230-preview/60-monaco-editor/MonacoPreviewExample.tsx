import { RotateCcw } from "lucide-react";
import * as React from "react";
import { transform } from "sucrase";
import { configureReactWorkers } from "../../setup-monaco-worker.js";
import "./MonacoPreviewExample.css";
import {
  Preview,
  PreviewHeader,
  PreviewTitle,
  PreviewActions,
  PreviewCodeToggle,
  PreviewContent,
  PreviewSource,
} from "../../../../src/components/Preview/index.js";
import { MonacoCodeGroup } from "../../../../src/components/MonacoEditorReact/MonacoCodeGroup.js";

import counterSource from "../../CounterExample.tsx?raw";
import counterStyles from "../../counterExample.css?raw";

/** Monaco is optional: only this example imports its editor implementation. */
export default function MonacoPreviewExample() {
  configureReactWorkers();
  const [source, setSource] = React.useState(counterSource);
  const [styles, setStyles] = React.useState(counterStyles);
  const result = React.useMemo(() => {
    try {
      const { code } = transform(source, {
        transforms: ["typescript", "jsx", "imports"],
        jsxRuntime: "classic",
      });
      const exports: { default?: React.ComponentType } = {};
      const load = (name: string) => {
        if (name === "react") return React;
        if (name === "./counterExample.css") return {};
        throw new Error(`Unsupported preview import: ${name}`);
      };
      new Function("React", "require", "exports", code)(React, load, exports);
      if (typeof exports.default !== "function")
        throw new Error("Export a React component as the default export.");
      return { Component: exports.default };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [source]);
  const files = [
    {
      name: "CounterExample.tsx",
      language: "typescript",
      value: source,
    },
    { name: "counterExample.css", language: "css", value: styles },
  ];
  return (
    <Preview source={source}>
      <PreviewHeader>
        <PreviewTitle>Monaco source editor</PreviewTitle>
        <PreviewActions>
          <PreviewCodeToggle asChild>
            <button type="button">
              Toggle editor
            </button>
          </PreviewCodeToggle>
          <button
            type="button"
            className="mf-preview-action"
            disabled={source === counterSource && styles === counterStyles}
            onClick={() => {
              setSource(counterSource);
              setStyles(counterStyles);
            }}
          >
            <RotateCcw size={15} aria-hidden="true" />
            Reset code
          </button>
        </PreviewActions>
      </PreviewHeader>
      <PreviewContent asChild>
        <div className="mf-monaco-preview-stage">
          <style>{`@scope (.mf-monaco-preview-stage) { ${styles} }`}</style>
          {result.Component ? (
            <PreviewRenderBoundary key={source}>
              <result.Component />
            </PreviewRenderBoundary>
          ) : (
            <p role="alert">{result.error}</p>
          )}
        </div>
      </PreviewContent>
      <PreviewSource asChild>
        <div className="mf-monaco-preview-editor">
          <MonacoCodeGroup
            files={files}
            editable
            height={320}
            options={{ fixedOverflowWidgets: true }}
            onFileChange={(name, value) => {
              if (name === "CounterExample.tsx") setSource(value);
              else setStyles(value);
            }}
          />
        </div>
      </PreviewSource>
    </Preview>
  );
}

class PreviewRenderBoundary extends React.Component<
  React.PropsWithChildren,
  { error?: string }
> {
  state: { error?: string } = {};
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <p role="alert">{this.state.error}</p>
    ) : (
      this.props.children
    );
  }
}
