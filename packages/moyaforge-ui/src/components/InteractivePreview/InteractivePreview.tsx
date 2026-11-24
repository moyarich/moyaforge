import "./InteractivePreview.css";
import type { ReactNode } from "react";
import { Settings2, PanelLeft, Code2 } from "lucide-react";
import { CodeGroup, CodeTab } from "../CodeGroup/index.js";
import {
  HighlightedCode,
  previewLanguage,
} from "../HighlightedCode/HighlightedCode.js";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../ResizablePanel/index.js";

export interface InteractivePreviewProps {
  /** Accessible name and visible heading for this example. */
  title: string;
  /** Optional introduction beneath the heading. */
  description?: ReactNode;
  /** Source text keyed by displayed filename; highlighting follows the extension. */
  files: Readonly<Record<string, string>>;
  /** Rendered example supplied by the consumer; source files are not executed. */
  children: ReactNode;
  /** Configuration controls. Shares a resizable row with metadata when both exist. */
  controls?: ReactNode;
  /** Resolved values displayed alongside controls, separate from the rendered example. */
  metadata?: ReactNode;
  /** Heading for resolved values. @default "Resolved metadata" */
  metadataTitle?: string;
  /** Optional description alongside the preview row title. */
  previewDescription?: ReactNode;
  /** Description alongside the source row title. @default "Source files" */
  sourceDescription?: ReactNode;
  /** Filename to place first in the source tabs. */
  primaryFile?: string;
  /** Additional root class for instance styling. */
  className?: string;
}

/** Reusable demo frame: configuration, rendered content, and highlighted source files. */
export function InteractivePreview({
  title,
  description,
  files,
  children,
  controls,
  metadata,
  metadataTitle = "Resolved metadata",
  previewDescription,
  sourceDescription = "Source files",
  primaryFile,
  className,
}: InteractivePreviewProps) {
  const orderedFiles = Object.entries(files).sort(
    ([left], [right]) =>
      Number(right === primaryFile) - Number(left === primaryFile),
  );
  const controlsContent =
    controls == null ? null : (
      <fieldset className="interactive-preview-controls">
        <legend>
          <Settings2 aria-hidden="true" />
          Controls
        </legend>
        {controls}
      </fieldset>
    );
  const metadataContent =
    metadata == null ? null : (
      <section
        className="interactive-preview-metadata"
        aria-label={`${title} metadata`}
      >
        <strong className="interactive-preview-metadata-title">
          {metadataTitle}
        </strong>
        {metadata}
      </section>
    );
  return (
    <section
      className={["interactive-preview", className].filter(Boolean).join(" ")}
      aria-label={title}
    >
      <header className="interactive-preview-header">
        <strong>{title}</strong>
        {description != null && <p>{description}</p>}
      </header>
      {(controlsContent || metadataContent) && (
        <div className="interactive-preview-configuration">
          {controlsContent && metadataContent ? (
            <ResizablePanelGroup>
              <ResizablePanel
                defaultSize={50}
                minSize={25}
                className="interactive-preview-configuration-panel"
              >
                {controlsContent}
              </ResizablePanel>
              <ResizableHandle aria-label="Resize preview controls" />
              <ResizablePanel
                defaultSize={50}
                minSize={25}
                className="interactive-preview-configuration-panel"
              >
                {metadataContent}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="interactive-preview-configuration-panel">
              {controlsContent}
              {metadataContent}
            </div>
          )}
        </div>
      )}
      <section
        className="interactive-preview-row"
        aria-label={`${title} result`}
      >
        <div className="interactive-preview-row-title">
          <PanelLeft aria-hidden="true" />
          <strong>Preview</strong>
          {previewDescription != null && <span>{previewDescription}</span>}
        </div>
        {children}
      </section>
      <section
        className="interactive-preview-row interactive-preview-code"
        aria-label={`${title} source`}
      >
        <div className="interactive-preview-row-title">
          <Code2 aria-hidden="true" />
          <strong>Code</strong>
          <span>{sourceDescription}</span>
        </div>
        <CodeGroup label={`${title} files`}>
          {orderedFiles.map(([path, code]) => (
            <CodeTab key={path} label={path}>
              <pre>
                <HighlightedCode code={code} language={previewLanguage(path)} />
              </pre>
            </CodeTab>
          ))}
        </CodeGroup>
      </section>
    </section>
  );
}
