import {
  Preview,
  PreviewHeader,
  PreviewTitle,
  PreviewActions,
  PreviewCodeToggle,
  PreviewCopyButton,
  PreviewContent,
  PreviewSource,
  PreviewFooter,
} from "../../../../src/components/Preview/index.js";

import "../../counterExample.css";

import CounterExample from "../../CounterExample.js";
import counterSource from "../../CounterExample.tsx?raw";

/** Slots can be omitted, replaced or reordered without modifying Preview. */
export default function LivePreviewExample() {
  return (
    <Preview source={counterSource}>
      <PreviewHeader>
        <PreviewTitle>Interactive counter</PreviewTitle>
        <PreviewActions>
          <PreviewCodeToggle />
          <PreviewCopyButton />
        </PreviewActions>
      </PreviewHeader>
      <PreviewContent>
        <CounterExample />
      </PreviewContent>
      <PreviewSource code={counterSource} language="tsx" />
      <PreviewFooter>Click the button, then inspect its source.</PreviewFooter>
    </Preview>
  );
}
