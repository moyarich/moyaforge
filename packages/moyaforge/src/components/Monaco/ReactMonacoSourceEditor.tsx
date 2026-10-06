import Editor, { type EditorProps } from "@monaco-editor/react";

export type ReactMonacoSourceEditorProps = EditorProps;

export function ReactMonacoSourceEditor(props: ReactMonacoSourceEditorProps) {
  return <Editor {...props} />;
}
