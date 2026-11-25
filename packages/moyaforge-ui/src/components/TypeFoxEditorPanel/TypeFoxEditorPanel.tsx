import {
  MonacoEditorTypeFox,
  type MonacoEditorTypeFoxProps,
} from "@moyarich/moyaforge-monaco/components/MonacoEditorTypeFox";
import type { MonacoFile } from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";
import { EditorPanel, type EditorPanelProps } from "../EditorPanel/index.js";

export interface TypeFoxEditorPanelProps extends Omit<EditorPanelProps<MonacoFile>, "renderEditor"> {
  height?: MonacoEditorTypeFoxProps["height"];
  width?: MonacoEditorTypeFoxProps["width"];
  theme?: MonacoEditorTypeFoxProps["theme"];
  options?: MonacoEditorTypeFoxProps["options"];
  vscodeApiConfig?: MonacoEditorTypeFoxProps["vscodeApiConfig"];
  languageClientConfig?: MonacoEditorTypeFoxProps["languageClientConfig"];
  onReady?: MonacoEditorTypeFoxProps["onReady"];
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
