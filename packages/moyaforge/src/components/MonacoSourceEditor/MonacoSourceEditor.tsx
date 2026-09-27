import { MonacoEditorReactComp } from "@typefox/monaco-editor-react";
import type { EditorAppConfig } from "monaco-languageclient/editorApp";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import type { CSSProperties, ReactNode } from "react";

export interface MonacoSourceEditorProps {
  vscodeApiConfig: MonacoVscodeApiConfig;
  editorAppConfig: EditorAppConfig;
  className?: string;
  style?: CSSProperties;
  loading?: ReactNode;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onTextChanged?: (contents: { modified?: string; original?: string }) => void;
}

export function MonacoSourceEditor({
  vscodeApiConfig,
  editorAppConfig,
  className,
  style,
  loading,
  onReady,
  onError,
  onTextChanged,
}: MonacoSourceEditorProps) {
  return (
    <div
      className={className}
      data-moyaforge-monaco-source-editor=""
      style={{ minHeight: 0, ...style }}
    >
      {loading}
      <MonacoEditorReactComp
        vscodeApiConfig={vscodeApiConfig}
        editorAppConfig={editorAppConfig}
        style={{ height: "100%" }}
        onEditorStartDone={onReady}
        onTextChanged={onTextChanged}
        onError={onError}
      />
    </div>
  );
}
