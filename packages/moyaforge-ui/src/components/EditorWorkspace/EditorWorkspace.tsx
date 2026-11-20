import "./EditorWorkspace.css";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronRight, Copy, FileCode2, LockKeyhole, Save } from "lucide-react";
import { CopyButton } from "../CopyButton/CopyButton.js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../Tabs/index.js";
import { EditorContainer, EditorToolbar, EditorTools, EditorBreadcrumbs, EditorContent } from "../EditorContainer/index.js";

export interface EditorWorkspaceFile {
  name: string;
  value: string;
  path?: string;
  readOnly?: boolean;
}
export interface EditorWorkspaceRenderProps<T extends EditorWorkspaceFile> {
  files: readonly T[];
  activeFile: T;
  onFileChange: (name: string, value: string) => void;
  readOnly: boolean;
}
export interface EditorWorkspaceProps<T extends EditorWorkspaceFile> {
  files: readonly T[];
  activeFile?: string;
  defaultActiveFile?: string;
  onActiveFileChange?: (name: string, file: T) => void;
  onFileChange?: (name: string, value: string, file: T) => void;
  onSave?: (name: string, value: string, file: T) => void;
  readOnly?: boolean;
  showCopyButton?: boolean;
  showBreadcrumbs?: boolean;
  renderBreadcrumbs?: (file: T) => ReactNode;
  tools?: ReactNode;
  renderEditor: (props: EditorWorkspaceRenderProps<T>) => ReactNode;
  className?: string;
}

/** Editor-agnostic tabs, actions and panels. The host owns file contents. */
export function EditorWorkspace<T extends EditorWorkspaceFile>({
  files, activeFile, defaultActiveFile, onActiveFileChange, onFileChange,
  onSave, readOnly = false, showCopyButton = true, showBreadcrumbs = false,
  renderBreadcrumbs, tools, renderEditor, className,
}: EditorWorkspaceProps<T>) {
  const [uncontrolled, setUncontrolled] = useState(defaultActiveFile ?? files[0]?.name ?? "");
  const selected = useMemo(
    () => files.find(file => file.name === (activeFile ?? uncontrolled)) ?? files[0],
    [files, activeFile, uncontrolled],
  );
  if (!selected) return null;
  const locked = readOnly || selected.readOnly === true;
  const select = (name: string) => {
    const file = files.find(item => item.name === name);
    if (!file) return;
    if (activeFile === undefined) setUncontrolled(name);
    onActiveFileChange?.(name, file);
  };
  const update = (name: string, value: string) => {
    const file = files.find(item => item.name === name);
    if (!file || readOnly || file.readOnly) return;
    onFileChange?.(name, value, file);
  };
  return (
    <EditorContainer className={className}>
      <Tabs value={selected.name} onValueChange={select}>
        <EditorToolbar>
          <TabsList aria-label="Open editor files">
            {files.map(file => (
              <TabsTrigger value={file.name} key={file.name}
                icon={<FileCode2 size={15} aria-hidden="true" />}>{file.name}</TabsTrigger>
            ))}
          </TabsList>
          <EditorTools>
            {locked && <span className="mf-editor-workspace-readonly"><LockKeyhole size={14} aria-hidden="true" />Read only</span>}
            {onSave && <button type="button" disabled={locked} aria-label={`Save ${selected.name}`} onClick={() => onSave(selected.name, selected.value, selected)}>
              <Save size={15} aria-hidden="true" /> Save
            </button>}
            {showCopyButton && <CopyButton value={selected.value} aria-label={`Copy ${selected.name}`} icon={<Copy size={15} aria-hidden="true" />} />}
            {tools}
          </EditorTools>
        </EditorToolbar>
        {showBreadcrumbs && <EditorBreadcrumbs>
          {renderBreadcrumbs ? renderBreadcrumbs(selected) :
            (selected.path ?? selected.name).replaceAll("\\", "/").split("/").filter(Boolean).map((part, index) => (
              <span className="mf-editor-workspace-crumb" key={index}>
                {index > 0 && <ChevronRight size={14} aria-hidden="true" />}{part}
              </span>
            ))}
        </EditorBreadcrumbs>}
        <EditorContent>
          <TabsContent value={selected.name} forceMount>
            {renderEditor({ files, activeFile: selected, onFileChange: update, readOnly })}
          </TabsContent>
        </EditorContent>
      </Tabs>
    </EditorContainer>
  );
}
