import * as React from "react";
import { transform } from "sucrase";
import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";
import { PreviewCodeEditor } from "../../../../src/components/PreviewCodeEditor/index.js";

const initialSource = `import React from "react";

export default function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <button onClick={() => {
      console.log("Button clicked", { count: count + 1 });
      console.table([{ previous: count, next: count + 1 }]);
      setCount(count + 1);
    }}>
      Clicked {count} times
    </button>
  );
}`;

function LiveComponent({ source, output }: { source: string; output: globalThis.Console }) {
  const result = React.useMemo(() => {
    try {
      const { code } = transform(source, {
        transforms: ["typescript", "jsx", "imports"],
        jsxRuntime: "classic",
      });
      const exports: { default?: React.ComponentType } = {};
      const load = (name: string) => {
        if (name === "react") return React;
        throw new Error("Unsupported import: " + name);
      };
      new Function("require", "exports", "console", code)(load, exports, output);
      if (typeof exports.default !== "function")
        throw new Error("Export a React component as default.");
      return { Component: exports.default };
    } catch (error) {
      return { error: String(error) };
    }
  }, [source, output]);
  return result.Component ? (
    <RenderBoundary key={source}><result.Component /></RenderBoundary>
  ) : <p role="alert">{result.error}</p>;
}

class RenderBoundary extends React.Component<React.PropsWithChildren, { error?: string }> {
  state: { error?: string } = {};
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? <p role="alert">{this.state.error}</p> : this.props.children;
  }
}

export default function Example() {
  const { messages, console: output, clear } = useConsoleMessages();
  return (
    <PreviewCodeEditor
      title="React counter with console"
      files={[{ name: "Counter.tsx", language: "typescript", value: initialSource }]}
      renderPreview={files => <LiveComponent source={files[0]?.value ?? ""} output={output} />}
      renderOutput={() => <Console messages={messages} onClear={clear} />}
      outputLabel="Console"
      defaultOutputOpen={false}
    />
  );
}
