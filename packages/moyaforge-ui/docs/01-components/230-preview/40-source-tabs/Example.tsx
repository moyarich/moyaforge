import {
  Preview,
  PreviewHeader,
  PreviewTitle,
  PreviewActions,
  PreviewCodeToggle,
  PreviewCopyButton,
  PreviewContent,
  PreviewSource,
} from "../../../../src/components/Preview/index.js";
import {
  CodeGroup,
  CodeTab,
} from "../../../../src/components/CodeGroup/index.js";
import CounterExample from "../../CounterExample.js";
import source from "../../CounterExample.tsx?raw";
import styles from "../../counterExample.css?raw";

export default function SourceTabsExample() {
  return (
    <Preview title="Counter source files" source={source}>
      <PreviewHeader>
        <PreviewTitle>Counter source files</PreviewTitle>
        <PreviewActions>
          <PreviewCodeToggle />
          <PreviewCopyButton />
        </PreviewActions>
      </PreviewHeader>
      <PreviewContent>
        <CounterExample />
      </PreviewContent>
      <PreviewSource asChild>
        <div>
          <CodeGroup label="Example files">
            <CodeTab label="CounterExample.tsx">
              <pre>
                <code>{source}</code>
              </pre>
            </CodeTab>
            <CodeTab label="counterExample.css">
              <pre>
                <code>{styles}</code>
              </pre>
            </CodeTab>
          </CodeGroup>
        </div>
      </PreviewSource>
    </Preview>
  );
}
