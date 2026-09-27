import { MonacoEditorReactComp } from "@typefox/monaco-editor-react";
import type { EditorAppConfig } from "monaco-languageclient/editorApp";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import type { CSSProperties } from "react";

export interface TypeFoxSourceEditorProps {
  vscodeApiConfig: MonacoVscodeApiConfig;
  editorAppConfig: EditorAppConfig;
  className?: string;
  style?: CSSProperties;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onTextChanged?: (contents: { modified?: string; original?: string }) => void;
}

export function TypeFoxSourceEditor({
  vscodeApiConfig,
  editorAppConfig,
  className,
  style,
  onReady,
  onError,
  onTextChanged,
}: TypeFoxSourceEditorProps) {
  return (
    <div className={className} data-moyaforge-typefox-source-editor="" style={{ minHeight: 0, ...style }}>
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
