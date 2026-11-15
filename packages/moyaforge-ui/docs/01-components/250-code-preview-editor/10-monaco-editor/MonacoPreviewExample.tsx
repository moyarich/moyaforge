import * as React from "react";
import { transform } from "sucrase";
import { configureReactWorkers } from "../../setup-monaco-worker.js";
import "./MonacoPreviewExample.css";

export interface MonacoPreviewExampleProps {
  source: string;
  styles: string;
}

/** Demo renderer for CodePreviewEditor; compilation stays with the host app. */
export default function MonacoPreviewExample({
  source,
  styles,
}: MonacoPreviewExampleProps) {
  configureReactWorkers();
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

  return (
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
