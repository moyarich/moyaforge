import { CodeRunner } from "../../../src/components/CodeRunner/index.js";

export default function Example() {
  return (
    <CodeRunner
      initialSource={'{"ready":true}'}
      runSource={(source) => JSON.parse(source) as unknown}
      renderOutput={({ state }) => {
        if (state.status === "success") return <pre>{JSON.stringify(state.output, null, 2)}</pre>;
        if (state.status === "error") return <p role="alert">{String(state.error)}</p>;
        return <p>Edit JSON and select Run.</p>;
      }}
    />
  );
}
