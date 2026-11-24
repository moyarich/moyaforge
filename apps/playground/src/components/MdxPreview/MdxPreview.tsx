import "./MdxPreview.css";
import type { ReactNode } from "react";
import { Settings2, PanelLeft, Code2 } from "lucide-react";
import {
  CodeGroup,
  CodeTab,
} from "../../../../../packages/moyaforge-ui/src/components/CodeGroup/index.js";
import {
  HighlightedCode,
  previewLanguage,
} from "../../../../../packages/moyaforge-ui/src/components/HighlightedCode/HighlightedCode.js";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../../../../packages/moyaforge-ui/src/components/ResizablePanel/index.js";

export interface MdxPreviewProps {
  title: string;
  description?: ReactNode;
  files: Readonly<Record<string, string>>;
  children: ReactNode;
  controls?: ReactNode;
  metadata?: ReactNode;
  metadataTitle?: string;
  previewDescription?: ReactNode;
  sourceDescription?: ReactNode;
  primaryFile?: string;
  className?: string;
}

/** Reusable demo frame: configuration, rendered content, and highlighted source files. */
export function MdxPreview({
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
}: MdxPreviewProps) {
  const orderedFiles = Object.entries(files).sort(
    ([left], [right]) =>
      Number(right === primaryFile) - Number(left === primaryFile),
  );
  const controlsContent =
    controls == null ? null : (
      <fieldset className="mdx-preview-controls">
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
        className="mdx-preview-metadata"
        aria-label={`${title} metadata`}
      >
        <strong className="mdx-preview-metadata-title">{metadataTitle}</strong>
        {metadata}
      </section>
    );
  return (
    <section
      className={["mdx-preview", className].filter(Boolean).join(" ")}
      aria-label={title}
    >
      <header className="mdx-preview-header">
        <strong>{title}</strong>
        {description != null && <p>{description}</p>}
      </header>
      {(controlsContent || metadataContent) && (
        <div className="mdx-preview-configuration">
          {controlsContent && metadataContent ? (
            <ResizablePanelGroup>
              <ResizablePanel
                defaultSize={50}
                minSize={25}
                className="mdx-preview-configuration-panel"
              >
                {controlsContent}
              </ResizablePanel>
              <ResizableHandle aria-label="Resize preview controls" />
              <ResizablePanel
                defaultSize={50}
                minSize={25}
                className="mdx-preview-configuration-panel"
              >
                {metadataContent}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="mdx-preview-configuration-panel">
              {controlsContent}
              {metadataContent}
            </div>
          )}
        </div>
      )}
      <section className="mdx-preview-row" aria-label={`${title} result`}>
        <div className="mdx-preview-row-title">
          <PanelLeft aria-hidden="true" />
          <strong>Preview</strong>
          {previewDescription != null && <span>{previewDescription}</span>}
        </div>
        {children}
      </section>
      <section
        className="mdx-preview-row mdx-preview-code"
        aria-label={`${title} source`}
      >
        <div className="mdx-preview-row-title">
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
