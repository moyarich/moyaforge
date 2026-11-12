import {
  CodeGroup,
  CodeTab,
} from "../../../../src/components/CodeGroup/index.js";

export default function Example() {
  return (
    <CodeGroup label="Install React">
      <CodeTab label="npm">
        <pre>
          <code>npm install react</code>
        </pre>
      </CodeTab>
      <CodeTab label="pnpm">
        <pre>
          <code>pnpm add react</code>
        </pre>
      </CodeTab>
    </CodeGroup>
  );
}
