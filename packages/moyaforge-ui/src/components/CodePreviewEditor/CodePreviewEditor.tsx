import "./CodePreviewEditor.css";
import { useState, type ReactNode } from "react";
import { ChevronRight, FileCode2, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../Tabs/index.js";
import { EditorContainer, EditorToolbar, EditorTools, EditorBreadcrumbs, EditorContent } from "../EditorContainer/index.js";
import { RotateCcw } from "lucide-react";
import {
  Preview,
  PreviewActions,
  PreviewCodeToggle,
  PreviewContent,
  PreviewHeader,
  PreviewSource,
  PreviewTitle,
} from "../Preview/index.js";
import {
  MonacoCodeGroup,
  type MonacoEditorReactProps,
  type MonacoFile,
} from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";

export interface CodePreviewEditorProps {
  /** Label shown above the live preview. */
  title: string;
  /** Initial editable source files. */
  files: readonly MonacoFile[];
  /** Render the current editor files using an application-owned renderer. */
  renderPreview: (files: readonly MonacoFile[]) => ReactNode;
  /** Optional integration snippet shown in Code and copied by the Preview toolbar. */
  usageSource?: string;
  /** File tab label for usageSource. Defaults to CodePreviewEditor.tsx. */
  usageFileName?: string;
  height?: number | string;
  options?: MonacoEditorReactProps["options"];
  /** Enable the composable editor layout; appearance uses CSS variables. */
  workspaceTabs?: boolean;
  tools?: ReactNode;
  showBreadcrumbs?: boolean;
  renderBreadcrumbs?: (file: MonacoFile) => ReactNode;
  onCloseFile?: (name: string, file: MonacoFile) => void;
}

/**
 * Pairs a live preview with editable Monaco files. The host supplies the renderer,
 * so this component never evaluates user-authored code or assumes a bundler.
 */
export function CodePreviewEditor({
  title,
  files,
  renderPreview,
  usageSource,
  usageFileName = "CodePreviewEditor.tsx",
  height = 320,
  options,
  workspaceTabs = false,
  tools,
  showBreadcrumbs = false,
  renderBreadcrumbs,
  onCloseFile,
}: CodePreviewEditorProps) {
  const [initialFiles] = useState(() => files.map((file) => ({ ...file })));
  const [currentFiles, setCurrentFiles] = useState(() =>
    files.map((file) => ({ ...file })),
  );

  const [activeFile, setActiveFile] = useState<string | undefined>();
  const editorFiles = usageSource
    ? [
        {
          name: usageFileName,
          language: "typescript",
          value: usageSource,
          readOnly: true,
        },
        ...currentFiles,
      ]
    : currentFiles;

  const selectedFile = editorFiles.find(file => file.name === activeFile) ?? editorFiles.find(file => !file.readOnly) ?? editorFiles[0];

  const unchanged =
    currentFiles.length === initialFiles.length &&
    currentFiles.every(
      (file, index) =>
        file.name === initialFiles[index]?.name &&
        file.value === initialFiles[index]?.value,
    );

  return (
    <Preview title={title} source={usageSource ?? currentFiles[0]?.value}>
      <PreviewHeader>
        <PreviewTitle>{title}</PreviewTitle>
        <PreviewActions>
          <PreviewCodeToggle />
          <button
            type="button"
            className="mf-preview-action"
            disabled={unchanged}
            onClick={() =>
              setCurrentFiles(
                initialFiles.map((file) => ({ ...file })),
              )
            }
          >
            <RotateCcw size={15} aria-hidden="true" />
            Reset code
          </button>
        </PreviewActions>
      </PreviewHeader>
      <PreviewContent asChild>
        <div className="mf-code-preview-editor-stage">
          {renderPreview(currentFiles)}
        </div>
      </PreviewContent>
      <PreviewSource asChild>
        <div className="mf-code-preview-editor-source">
          {workspaceTabs && selectedFile ? (
            <EditorContainer>
              <Tabs value={selectedFile.name} onValueChange={setActiveFile} >
                <EditorToolbar>
                  <TabsList aria-label="Source files">
                    {editorFiles.map(file => (
                      <TabsTrigger key={file.name} value={file.name}
                        icon={/\.mdx?$/i.test(file.name) ? <FileText size={16} /> : <FileCode2 size={16} />}
                        onClose={onCloseFile ? () => onCloseFile(file.name, file) : undefined}>
                        {file.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {tools && <EditorTools>{tools}</EditorTools>}
                </EditorToolbar>
                {showBreadcrumbs && <EditorBreadcrumbs>
                  {renderBreadcrumbs ? renderBreadcrumbs(selectedFile) :
                    (selectedFile.path ?? selectedFile.name).replaceAll("\\", "/").split("/").filter(Boolean).map((part, index) => (
                      <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {index > 0 && <ChevronRight size={14} aria-hidden="true" />}{part}
                      </span>
                    ))}
                </EditorBreadcrumbs>}
                <EditorContent>
                  <TabsContent value={selectedFile.name} forceMount>
          <MonacoCodeGroup
            files={editorFiles}
            activeFile={selectedFile?.name}
            onActiveFileChange={setActiveFile}
            showFileTabs={false}
            showCopyButton={false}
            editable
            height={height}
            options={{ fixedOverflowWidgets: true, ...options }}
            onFileChange={(name, value) => {
              setCurrentFiles((current) =>
                current.map((file) =>
                  file.name === name ? { ...file, value } : file,
                ),
              );
            }}
          />
                  </TabsContent>
                </EditorContent>
              </Tabs>
            </EditorContainer>
          ) : (
          <MonacoCodeGroup
            files={editorFiles}
            defaultActiveFile={currentFiles.find((file) => !file.readOnly)?.name}
            editable
            height={height}
            options={{ fixedOverflowWidgets: true, ...options }}
            onFileChange={(name, value) => {
              setCurrentFiles((current) =>
                current.map((file) =>
                  file.name === name ? { ...file, value } : file,
                ),
              );
            }}
          />
          )}
        </div>
      </PreviewSource>
    </Preview>
  );
}
