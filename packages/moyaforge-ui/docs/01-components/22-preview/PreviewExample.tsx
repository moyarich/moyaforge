import "./PreviewExample.css";
import { useState } from "react";
import { Preview } from "../../../src/components/Preview/Preview.js";

/** Standalone interactive documentation example, imported directly by MDX. */
export default function PreviewExample() {
  const [count, setCount] = useState(0);
  return (
    <Preview title="Counter" source={counterSource} language="tsx">
      <button className="mf-preview-example-button" type="button" onClick={() => setCount((n) => n + 1)}>
        Clicked {count} times
      </button>
    </Preview>
  );
}

const counterSource = `import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button type="button" onClick={() => setCount((n) => n + 1)}>
    Clicked {count} times
  </button>;
}`;
