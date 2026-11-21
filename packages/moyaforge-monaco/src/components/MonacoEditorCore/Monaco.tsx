import "./Monaco.css";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { reconcileFileDrafts } from "./drafts.js";

export interface MonacoFile {
  name: string;
  value: string;
  language?: string;
  path?: string;
  readOnly?: boolean;
}
export interface MonacoEditorRenderProps {
  file: MonacoFile;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}
export interface MonacoProps {
  files: readonly MonacoFile[];
  activeFile?: string;
  onFileChange?: (name: string, value: string, file: MonacoFile) => void;
  readOnly?: boolean;
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
