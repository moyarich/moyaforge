import {
  MonacoEditorReact,
  type MonacoEditorReactProps,
} from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";
import {
  EditorWorkspace,
  type EditorWorkspaceProps,
} from "../EditorWorkspace/index.js";
import type { MonacoFile } from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";

export interface MonacoEditorWorkspaceProps extends Omit<EditorWorkspaceProps<MonacoFile>, "renderEditor"> {
  height?: MonacoEditorReactProps["height"];
  width?: MonacoEditorReactProps["width"];
  theme?: MonacoEditorReactProps["theme"];
  options?: MonacoEditorReactProps["options"];
  loading?: MonacoEditorReactProps["loading"];
  beforeMount?: MonacoEditorReactProps["beforeMount"];
  onMount?: MonacoEditorReactProps["onMount"];
}

/** React Monaco editor embedded in UI-owned editor chrome. */
export function MonacoEditorWorkspace({
  files, height, width, theme, options, loading, beforeMount, onMount,
  ...props
}: MonacoEditorWorkspaceProps) {
  return (
    <EditorWorkspace
      {...props}
      files={files}
      renderEditor={({ activeFile, onFileChange, readOnly }) => (
        <MonacoEditorReact
          files={files}
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
