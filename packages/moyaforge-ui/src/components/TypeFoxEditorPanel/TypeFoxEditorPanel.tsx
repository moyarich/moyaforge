import {
  MonacoEditorTypeFox,
  type MonacoEditorTypeFoxProps,
} from "@moyarich/moyaforge-monaco/components/MonacoEditorTypeFox";
import type { MonacoFile } from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";
import { EditorPanel, type EditorPanelProps } from "../EditorPanel/index.js";

/** EditorPanel file controls plus TypeFox Monaco and language-service settings. */
export interface TypeFoxEditorPanelProps extends Omit<EditorPanelProps<MonacoFile>, "renderEditor"> {
  /** Editor height; defaults to 320. */
  height?: MonacoEditorTypeFoxProps["height"];
  /** Editor width; defaults to 100%. */
  width?: MonacoEditorTypeFoxProps["width"];
  /** Optional Monaco theme; omit for automatic theme. */
  theme?: MonacoEditorTypeFoxProps["theme"];
  /** Native editor construction options. */
  options?: MonacoEditorTypeFoxProps["options"];
  /** Host VS Code API configuration, including worker setup. */
  vscodeApiConfig?: MonacoEditorTypeFoxProps["vscodeApiConfig"];
  /** Optional language client configuration. */
  languageClientConfig?: MonacoEditorTypeFoxProps["languageClientConfig"];
  /** Called when the editor starts. */
  onReady?: MonacoEditorTypeFoxProps["onReady"];
  /** Called when the runtime reports an error. */
  onError?: MonacoEditorTypeFoxProps["onError"];
}

/** TypeFox runtime embedded in the same UI-owned editor chrome. */
export function TypeFoxEditorPanel({
  files, height, width, theme, options, vscodeApiConfig, languageClientConfig,
  onReady, onError, ...props
}: TypeFoxEditorPanelProps) {
  return (
    <EditorPanel {...props} files={files}
      renderEditor={({ files: currentFiles, activeFile, onFileChange, readOnly }) => (
        <MonacoEditorTypeFox
          files={currentFiles} activeFile={activeFile.name} onFileChange={onFileChange}
          readOnly={readOnly} height={height} width={width} theme={theme} options={options}
          vscodeApiConfig={vscodeApiConfig} languageClientConfig={languageClientConfig}
          onReady={onReady} onError={onError}
        />
      )}
    />
  );
}
