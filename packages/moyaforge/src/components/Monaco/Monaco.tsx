import { useEffect, useMemo, useState, type ReactNode } from "react";

export interface MonacoFile {
  name: string;
  value: string;
  language?: string;
  path?: string;
}

export interface MonacoEditorRenderProps {
  file: MonacoFile;
  value: string;
  onChange: (value: string) => void;
}

export interface MonacoProps {
  files: readonly MonacoFile[];
  activeFile?: string;
  defaultActiveFile?: string;
  onActiveFileChange?: (name: string, file: MonacoFile) => void;
  onFileChange?: (name: string, value: string, file: MonacoFile) => void;
  renderEditor: (props: MonacoEditorRenderProps) => ReactNode;
  showFileTabs?: boolean;
}

export function Monaco({
  files,
  activeFile: controlledActiveFile,
  defaultActiveFile,
  onActiveFileChange,
  onFileChange,
  renderEditor,
  showFileTabs = true,
}: MonacoProps) {
  const [uncontrolledActiveFile, setUncontrolledActiveFile] = useState(defaultActiveFile ?? files[0]?.name ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(files.map((file) => [file.name, file.value])),
  );

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      for (const file of files) if (!(file.name in next)) next[file.name] = file.value;
      return next;
    });
  }, [files]);

  const selectedName = controlledActiveFile ?? uncontrolledActiveFile;
  const selectedFile = useMemo(
    () => files.find((file) => file.name === selectedName) ?? files[0],
    [files, selectedName],
  );

  if (!selectedFile) return null;

  function selectFile(file: MonacoFile) {
    if (controlledActiveFile === undefined) setUncontrolledActiveFile(file.name);
    onActiveFileChange?.(file.name, file);
  }

  function changeFile(value: string) {
    setDrafts((current) => ({ ...current, [selectedFile.name]: value }));
    onFileChange?.(selectedFile.name, value, selectedFile);
  }

  return (
    <div data-moyaforge-monaco="">
      {showFileTabs && files.length > 1 ? (
        <div data-moyaforge-monaco-tabs="" role="tablist" aria-label="Files">
          {files.map((file) => (
            <button
              key={file.name}
              type="button"
              role="tab"
              aria-selected={file.name === selectedFile.name}
              onClick={() => selectFile(file)}
            >
              {file.name}
            </button>
          ))}
        </div>
      ) : null}
      <div data-moyaforge-monaco-editor="">
        {renderEditor({
          file: selectedFile,
          value: drafts[selectedFile.name] ?? selectedFile.value,
          onChange: changeFile,
        })}
      </div>
    </div>
  );
}
