import { Monaco, type MonacoFile } from "./Monaco.js";
import { ReactMonacoSourceEditor } from "./ReactMonacoSourceEditor.js";

export interface MonacoCodeGroupProps {
  files: readonly MonacoFile[];
  height?: number;
  editable?: boolean;
  theme?: string;
}
export function MonacoCodeGroup({ files, height = 320, editable = false, theme = "vs-dark" }: MonacoCodeGroupProps) {
  return <Monaco files={files} renderEditor={({ file, value, onChange }) =>
    <ReactMonacoSourceEditor
      path={file.path ?? file.name}
      language={file.language}
      value={value}
      onChange={(next) => { if (next !== undefined && editable) onChange(next); }}
      height={height}
      theme={theme}
      options={{ readOnly: !editable, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, wordWrap: "on" }}
    />
  } />;
}
