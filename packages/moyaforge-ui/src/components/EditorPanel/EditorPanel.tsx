import "./EditorPanel.css";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronRight, Copy, FileCode2, LockKeyhole, Save } from "lucide-react";
import { CopyButton } from "../CopyButton/CopyButton.js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../Tabs/index.js";
import { EditorContainer, EditorToolbar, EditorTools, EditorBreadcrumbs, EditorContent } from "../EditorContainer/index.js";

/** A named source file; name must identify the file uniquely within the panel. */
export interface EditorPanelFile {
  /** Unique file name used by tabs and selection. */
  name: string;
  /** Initial or host-updated file text. */
  value: string;
  /** Optional path displayed in breadcrumbs. */
  path?: string;
  /** Prevent editing (per file or across the panel). */
  readOnly?: boolean;
}
/** Current draft files and change callback supplied to the host editor renderer. */
export interface EditorPanelRenderProps<T extends EditorPanelFile> {
  /** Files in tab order. */
  files: readonly T[];
  /** Controlled active file; omit to let the panel select it. */
  activeFile: T;
  /** Called with the file name, new draft text and file record. */
  onFileChange: (name: string, value: string) => void;
  readOnly: boolean;
}
/** Configure file tabs, controlled selection, editing, saving and a custom editor renderer. */
export interface EditorPanelProps<T extends EditorPanelFile> {
  files: readonly T[];
  activeFile?: string;
  /** Initial uncontrolled selection; defaults to the first file. */
  defaultActiveFile?: string;
  /** Called when a file tab is selected. */
  onActiveFileChange?: (name: string, file: T) => void;
  onFileChange?: (name: string, value: string, file: T) => void;
  /** Optional save action; enables the Save button and Ctrl/Cmd+S. */
  onSave?: (name: string, value: string, file: T) => void;
  readOnly?: boolean;
  /** Show the copy action. @default true */
  showCopyButton?: boolean;
  /** Show path breadcrumbs. @default false */
  showBreadcrumbs?: boolean;
  /** Override the displayed file breadcrumbs. */
  renderBreadcrumbs?: (file: T) => ReactNode;
  /** Additional toolbar actions. */
  tools?: ReactNode;
  /** Render the editor using the current file state and update callback. */
  renderEditor: (props: EditorPanelRenderProps<T>) => ReactNode;
  /** Additional container class. */
  className?: string;
}

/** Editor-agnostic tabs, actions and panels. The host owns file contents. */
export function EditorPanel<T extends EditorPanelFile>({
  files, activeFile, defaultActiveFile, onActiveFileChange, onFileChange,
  onSave, readOnly = false, showCopyButton = true, showBreadcrumbs = false,
  renderBreadcrumbs, tools, renderEditor, className,
}: EditorPanelProps<T>) {
  const [uncontrolled, setUncontrolled] = useState(defaultActiveFile ?? files[0]?.name ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const previousValues = useRef(new Map(files.map(file => [file.name, file.value])));

  useEffect(() => {
    const previous = previousValues.current;
    setDrafts(current => Object.fromEntries(files.map(file => [
      file.name,
      previous.get(file.name) !== file.value
        ? file.value
        : (current[file.name] ?? file.value),
    ])));
    previousValues.current = new Map(files.map(file => [file.name, file.value]));
  }, [files]);

  const currentFiles = useMemo(
    () => files.map(file => ({
      ...file,
      value: drafts[file.name] ?? file.value,
    }) as T),
    [files, drafts],
  );
  const selected = useMemo(
    () => currentFiles.find(file => file.name === (activeFile ?? uncontrolled)) ?? currentFiles[0],
    [currentFiles, activeFile, uncontrolled],
  );
  if (!selected) return null;
  const locked = readOnly || selected.readOnly === true;
  const select = (name: string) => {
    const file = currentFiles.find(item => item.name === name);
    if (!file) return;
    if (activeFile === undefined) setUncontrolled(name);
    onActiveFileChange?.(name, file);
  };
  const update = (name: string, value: string) => {
    const file = currentFiles.find(item => item.name === name);
    if (!file || readOnly || file.readOnly) return;
    setDrafts(current => ({ ...current, [name]: value }));
    onFileChange?.(name, value, file);
  };
  return (
    <EditorContainer className={className} onKeyDownCapture={event => {
      if (onSave && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        event.stopPropagation();
        if (!locked) onSave(selected.name, selected.value, selected);
      }
    }}>
      <Tabs value={selected.name} onValueChange={select}>
        <EditorToolbar>
          <TabsList tabsScroll aria-label="Open editor files">
            {currentFiles.map(file => (
              <TabsTrigger value={file.name} key={file.name}
                icon={<FileCode2 size={15} aria-hidden="true" />}>{file.name}</TabsTrigger>
            ))}
          </TabsList>
          <EditorTools>
            {locked && <span className="mf-editor-panel-readonly"><LockKeyhole size={14} aria-hidden="true" />Read only</span>}
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
              <span className="mf-editor-panel-crumb" key={index}>
                {index > 0 && <ChevronRight size={14} aria-hidden="true" />}{part}
              </span>
            ))}
        </EditorBreadcrumbs>}
        <EditorContent>
          <TabsContent value={selected.name} forceMount>
            {renderEditor({ files: currentFiles, activeFile: selected, onFileChange: update, readOnly })}
          </TabsContent>
        </EditorContent>
      </Tabs>
    </EditorContainer>
  );
}
