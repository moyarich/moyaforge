import "./PreviewCodeEditor.css";
import { useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import {
  Preview, PreviewActions, PreviewCodeToggle, PreviewContent,
  PreviewHeader, PreviewSource, PreviewTitle,
} from "../Preview/index.js";
import { MonacoEditorPanel } from "../MonacoEditorPanel/index.js";
import type { MonacoEditorReactProps, MonacoFile } from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";

export interface PreviewCodeEditorProps {
  title: string;
  files: readonly MonacoFile[];
  renderPreview: (files: readonly MonacoFile[]) => ReactNode;
  usageSource?: string;
  usageFileName?: string;
  height?: number | string;
  options?: MonacoEditorReactProps["options"];
  tools?: ReactNode;
  showBreadcrumbs?: boolean;
  renderBreadcrumbs?: (file: MonacoFile) => ReactNode;
}

/** Preview with the shared UI editor chrome and the React Monaco runtime. */
export function PreviewCodeEditor({
  title, files, renderPreview, usageSource,
  usageFileName = "PreviewCodeEditor.tsx", height = 320, options,
  tools, showBreadcrumbs = false, renderBreadcrumbs,
}: PreviewCodeEditorProps) {
  const [initialFiles] = useState(() => files.map(file => ({ ...file })));
  const [currentFiles, setCurrentFiles] = useState(() => files.map(file => ({ ...file })));
  const editorFiles: MonacoFile[] = usageSource
    ? [{ name: usageFileName, language: "typescript", value: usageSource, readOnly: true }, ...currentFiles]
    : currentFiles;
  const unchanged = currentFiles.length === initialFiles.length &&
    currentFiles.every((file, index) =>
      file.name === initialFiles[index]?.name && file.value === initialFiles[index]?.value);
  return (
    <Preview title={title} source={usageSource ?? currentFiles[0]?.value}>
      <PreviewHeader>
        <PreviewTitle>{title}</PreviewTitle>
        <PreviewActions>
          <PreviewCodeToggle />
          <button type="button" className="mf-preview-action" disabled={unchanged}
            onClick={() => setCurrentFiles(initialFiles.map(file => ({ ...file })))}>
            <RotateCcw size={15} aria-hidden="true" />Reset code
          </button>
        </PreviewActions>
      </PreviewHeader>
      <PreviewContent asChild>
        <div className="mf-preview-code-editor-stage">{renderPreview(currentFiles)}</div>
      </PreviewContent>
      <PreviewSource asChild>
        <div className="mf-preview-code-editor-source">
          <MonacoEditorPanel
            files={editorFiles}
            defaultActiveFile={currentFiles.find(file => !file.readOnly)?.name}
            height={height}
            options={{ fixedOverflowWidgets: true, ...options }}
            showBreadcrumbs={showBreadcrumbs}
            renderBreadcrumbs={renderBreadcrumbs}
            tools={tools}
            onFileChange={(name, value) => {
              setCurrentFiles(current => current.map(file =>
                file.name === name ? { ...file, value } : file));
            }}
          />
        </div>
      </PreviewSource>
    </Preview>
  );
}
