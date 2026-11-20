import {
  MonacoEditorTypeFox,
  type MonacoEditorTypeFoxProps,
} from "@moyarich/moyaforge-monaco/components/MonacoEditorTypeFox";
import type { MonacoFile } from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";
import { EditorWorkspace, type EditorWorkspaceProps } from "../EditorWorkspace/index.js";

export interface TypeFoxEditorWorkspaceProps extends Omit<EditorWorkspaceProps<MonacoFile>, "renderEditor"> {
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
export function TypeFoxEditorWorkspace({
  files, height, width, theme, options, vscodeApiConfig, languageClientConfig,
  onReady, onError, ...props
}: TypeFoxEditorWorkspaceProps) {
  return (
    <EditorWorkspace {...props} files={files}
      renderEditor={({ activeFile, onFileChange, readOnly }) => (
        <MonacoEditorTypeFox
          files={files} activeFile={activeFile.name} onFileChange={onFileChange}
          readOnly={readOnly} height={height} width={width} theme={theme} options={options}
          vscodeApiConfig={vscodeApiConfig} languageClientConfig={languageClientConfig}
          onReady={onReady} onError={onError}
        />
      )}
    />
  );
}
