import { Children, isValidElement, type ReactNode } from "react";
import {
  CODE_REPLACEMENTS,
  CodePreview,
  type CodePreviewProps,
  type PreviewFile,
} from "./CodePreview.js";
import { HighlightedCode, previewLanguage } from "../HighlightedCode/HighlightedCode.js";

type PreviewSourcesProps = Pick<CodePreviewProps, "files" | "replacements">;

/** Supplies explicit source tabs to an inline preview. */
export function PreviewSources(_props: PreviewSourcesProps) {
  return null;
}

export function InlineCodePreview({
  title = "Example",
  code,
  sourceFiles,
  replacementPreset,
  sourceOnly = false,
  children,
}: {
  title?: string;
  code: string;
  sourceFiles?: string;
  replacementPreset?: "portable";
  sourceOnly?: boolean;
  children: ReactNode;
}) {
  const content = Children.toArray(children);
  const sources = content.find(
    (child) =>
      isValidElement<PreviewSourcesProps>(child) &&
      child.type === PreviewSources,
  );
  if (isValidElement<PreviewSourcesProps>(sources)) {
    return (
      <CodePreview title={title} {...sources.props}>
        {content.filter((child) => child !== sources)}
      </CodePreview>
    );
  }

  const files: PreviewFile[] = sourceFiles ? JSON.parse(sourceFiles) : [];
  if (code || !files.length)
    files.unshift({ label: "Example.mdx", code, language: "mdx" });
  const sourceFile = files[0];
  const previewContent =
    sourceOnly && sourceFile ? (
      <pre>
        <HighlightedCode
          code={sourceFile.code}
          language={sourceFile.language ?? previewLanguage(sourceFile.label)}
        />
      </pre>
    ) : (
      children
    );

  return (
    <CodePreview
      title={title}
      files={files}
      replacements={
        replacementPreset === "portable" ? CODE_REPLACEMENTS : undefined
      }
    >
      {previewContent}
    </CodePreview>
  );
}
