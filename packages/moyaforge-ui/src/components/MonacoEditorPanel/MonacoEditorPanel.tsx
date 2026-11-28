import {
  MonacoEditorReact,
  type MonacoEditorReactProps,
} from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";
import {
  EditorPanel,
  type EditorPanelProps,
} from "../EditorPanel/index.js";
import type { MonacoFile } from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";

/** EditorPanel file controls plus native React Monaco runtime settings. */
export interface MonacoEditorPanelProps extends Omit<EditorPanelProps<MonacoFile>, "renderEditor"> {
  /** Editor height; defaults to 320. */
  height?: MonacoEditorReactProps["height"];
  /** Editor width; defaults to 100%. */
  width?: MonacoEditorReactProps["width"];
  /** Optional Monaco theme; omit for automatic theme. */
  theme?: MonacoEditorReactProps["theme"];
  /** Native Monaco editor options. */
  options?: MonacoEditorReactProps["options"];
  /** Custom loading indicator. */
  loading?: MonacoEditorReactProps["loading"];
  /** Callback before editor creation. */
  beforeMount?: MonacoEditorReactProps["beforeMount"];
  /** Callback with the mounted editor and Monaco API. */
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
