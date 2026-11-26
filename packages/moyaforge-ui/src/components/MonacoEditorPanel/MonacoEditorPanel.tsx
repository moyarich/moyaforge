import {
  MonacoEditorReact,
  type MonacoEditorReactProps,
} from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";
import {
  EditorPanel,
  type EditorPanelProps,
} from "../EditorPanel/index.js";
import type { MonacoFile } from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";

export interface MonacoEditorPanelProps extends Omit<EditorPanelProps<MonacoFile>, "renderEditor"> {
  height?: MonacoEditorReactProps["height"];
  width?: MonacoEditorReactProps["width"];
  theme?: MonacoEditorReactProps["theme"];
  options?: MonacoEditorReactProps["options"];
  loading?: MonacoEditorReactProps["loading"];
  beforeMount?: MonacoEditorReactProps["beforeMount"];
  onMount?: MonacoEditorReactProps["onMount"];
}

/** React Monaco editor embedded in UI-owned editor chrome. */
export function MonacoEditorPanel({
  files, height, width, theme, options, loading, beforeMount, onMount,
  ...props
}: MonacoEditorPanelProps) {
  return (
    <EditorPanel
      {...props}
      files={files}
      renderEditor={({ files: currentFiles, activeFile, onFileChange, readOnly }) => (
        <MonacoEditorReact
          files={currentFiles}
          activeFile={activeFile.name}
          onFileChange={onFileChange}
          readOnly={readOnly}
          height={height}
          width={width}
          theme={theme}
          options={options}
          loading={loading}
          beforeMount={beforeMount}
          onMount={onMount}
        />
      )}
    />
  );
}
