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
import { HighlightedCode } from "../../../../src/components/HighlightedCode/HighlightedCode.js";
import CounterExample from "../../CounterExample.js";
import source from "../../CounterExample.tsx?raw";
import styles from "../../counterExample.css?raw";
import exampleSource from "./SourceTabsExample.tsx?raw";

const compositionSource = exampleSource
  .replace(/const compositionSource = exampleSource[\s\S]*?;\n\n/, "")
  .replace("import exampleSource", "import compositionSource")
  .replaceAll("../../../../src/components/", "./components/ui/")
  .replaceAll("../../CounterExample", "./CounterExample")
  .replaceAll("../../counterExample.css", "./counterExample.css");

export default function SourceTabsExample() {
  return (
    <Preview title="Counter source files" source={compositionSource}>
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
            <CodeTab label="SourceTabsExample.tsx">
              <pre>
                <HighlightedCode code={compositionSource} language="tsx" />
              </pre>
            </CodeTab>
            <CodeTab label="CounterExample.tsx">
              <pre>
                <HighlightedCode code={source} language="tsx" />
              </pre>
            </CodeTab>
            <CodeTab label="counterExample.css">
              <pre>
                <HighlightedCode code={styles} language="css" />
              </pre>
            </CodeTab>
          </CodeGroup>
        </div>
      </PreviewSource>
    </Preview>
  );
}
