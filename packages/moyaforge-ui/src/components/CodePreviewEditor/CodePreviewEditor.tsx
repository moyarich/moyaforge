import "./CodePreviewEditor.css";
import { useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import {
  Preview,
  PreviewActions,
  PreviewCodeToggle,
  PreviewContent,
  PreviewHeader,
  PreviewSource,
  PreviewTitle,
} from "../Preview/index.js";
import {
  MonacoCodeGroup,
  type MonacoEditorReactProps,
} from "../MonacoEditorReact/index.js";
import type { MonacoFile } from "../MonacoEditorCore/Monaco.js";

export interface CodePreviewEditorProps {
  /** Label shown above the live preview. */
  title: string;
  /** Initial editable source files. */
  files: readonly MonacoFile[];
  /** Render the current editor files using an application-owned renderer. */
  renderPreview: (files: readonly MonacoFile[]) => ReactNode;
  /** Optional integration snippet shown in Code and copied by the Preview toolbar. */
  usageSource?: string;
  /** File tab label for usageSource. Defaults to CodePreviewEditor.tsx. */
  usageFileName?: string;
  height?: number | string;
  options?: MonacoEditorReactProps["options"];
}

/**
 * Pairs a live preview with editable Monaco files. The host supplies the renderer,
 * so this component never evaluates user-authored code or assumes a bundler.
 */
export function CodePreviewEditor({
  title,
  files,
  renderPreview,
  usageSource,
  usageFileName = "CodePreviewEditor.tsx",
  height = 320,
  options,
}: CodePreviewEditorProps) {
  const [initialFiles] = useState(() => files.map((file) => ({ ...file })));
  const [currentFiles, setCurrentFiles] = useState(() =>
    files.map((file) => ({ ...file })),
  );

  const editorFiles = usageSource
    ? [
        {
          name: usageFileName,
          language: "typescript",
          value: usageSource,
          readOnly: true,
        },
        ...currentFiles,
      ]
    : currentFiles;

  const unchanged =
    currentFiles.length === initialFiles.length &&
    currentFiles.every(
      (file, index) =>
        file.name === initialFiles[index]?.name &&
        file.value === initialFiles[index]?.value,
    );

  return (
    <Preview title={title} source={usageSource ?? currentFiles[0]?.value}>
      <PreviewHeader>
        <PreviewTitle>{title}</PreviewTitle>
        <PreviewActions>
          <PreviewCodeToggle />
          <button
            type="button"
            className="mf-preview-action"
            disabled={unchanged}
            onClick={() =>
              setCurrentFiles(
                initialFiles.map((file) => ({ ...file })),
              )
            }
          >
            <RotateCcw size={15} aria-hidden="true" />
            Reset code
          </button>
        </PreviewActions>
      </PreviewHeader>
      <PreviewContent asChild>
        <div className="mf-code-preview-editor-stage">
          {renderPreview(currentFiles)}
        </div>
      </PreviewContent>
      <PreviewSource asChild>
        <div className="mf-code-preview-editor-source">
          <MonacoCodeGroup
            files={editorFiles}
            defaultActiveFile={currentFiles.find((file) => !file.readOnly)?.name}
            editable
            height={height}
            options={{ fixedOverflowWidgets: true, ...options }}
            onFileChange={(name, value) => {
              setCurrentFiles((current) =>
                current.map((file) =>
                  file.name === name ? { ...file, value } : file,
                ),
              );
            }}
          />
        </div>
      </PreviewSource>
    </Preview>
  );
}
