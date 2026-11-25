import "./Monaco.css";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { reconcileFileDrafts } from "../../models/reconcileFileDrafts.js";

/** Source file and optional model metadata supplied by the host. */
export interface MonacoFile {
  name: string;
  value: string;
  language?: string;
  path?: string;
  readOnly?: boolean;
}
/** Selected file draft and change callback passed to a headless renderer. */
export interface MonacoEditorRenderProps {
  file: MonacoFile;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}
/** Host-controlled file selection and editor rendering configuration. */
export interface MonacoProps {
  files: readonly MonacoFile[];
  /** Selected file name; defaults to the first file. */
  activeFile?: string;
  /** Receives local draft changes; the host owns persistence. */
  onFileChange?: (name: string, value: string, file: MonacoFile) => void;
  readOnly?: boolean;
  /** Render the selected file using the supplied draft state. */
  renderEditor: (props: MonacoEditorRenderProps) => ReactNode;
  className?: string;
}

/** Headless file state and rendering adapter. No editor chrome or toolbar. */
export function Monaco({ files, activeFile, onFileChange, readOnly = false, renderEditor, className }: MonacoProps) {
  if (new Set(files.map(file => file.name)).size !== files.length)
    throw new Error("Monaco file names must be unique.");
  const [drafts, setDrafts] = useState<Record<string, string>>(
    () => Object.fromEntries(files.map(file => [file.name, file.value])),
  );
  const previousValues = useRef(new Map(files.map(file => [file.name, file.value])));
  useEffect(() => {
    const previous = previousValues.current;
    setDrafts(current => reconcileFileDrafts(current, previous, files));
    previousValues.current = new Map(files.map(file => [file.name, file.value]));
  }, [files]);
  const selectedFile = useMemo(
    () => files.find(file => file.name === activeFile) ?? files[0],
    [files, activeFile],
  );
  if (!selectedFile) return null;
  const locked = readOnly || selectedFile.readOnly === true;
  return (
    <div data-moyaforge-monaco="" className={["mf-monaco-runtime", className].filter(Boolean).join(" ")}
      data-readonly={locked || undefined}>
      {renderEditor({
        file: selectedFile,
        value: drafts[selectedFile.name] ?? selectedFile.value,
        readOnly: locked,
        onChange: value => {
          if (locked) return;
          setDrafts(current => ({ ...current, [selectedFile.name]: value }));
          onFileChange?.(selectedFile.name, value, selectedFile);
        },
      })}
    </div>
  );
}
