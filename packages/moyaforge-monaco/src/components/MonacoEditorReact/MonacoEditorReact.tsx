import { useEditorTheme } from "../../hooks/useEditorTheme.js";
import { useEffect, useId, useRef } from "react";
import type { EditorProps, OnMount } from "@monaco-editor/react";
import { MonacoFileSession, type MonacoFileSessionProps } from "../MonacoFileSession/MonacoFileSession.js";
import { ReactMonacoSourceEditor } from "./ReactMonacoSourceEditor.js";

/** Configuration for the headless editor runtime. */
export interface MonacoEditorReactProps extends Omit<
  MonacoFileSessionProps,
  "renderEditor"
>, Omit<EditorProps, "value" | "defaultValue" | "path" | "defaultPath" | "language" | "defaultLanguage" | "keepCurrentModel"> {
  // The file session owns model identity, content, language and disposal.
}

/** Optional real Monaco editor with independent models, file drafts and host-owned persistence. */
export function MonacoEditorReact({
  height = 320,
  width = "100%",
  theme,
  options,
  loading,
  beforeMount,
  onMount,
  onChange: onEditorChange,
  files,
  activeFile,
  onFileChange,
  readOnly: sessionReadOnly,
  className,
  ...editorProps
}: MonacoEditorReactProps) {
  const id = useId();
  if (
    new Set(
      files.map((file) => (file.path ?? file.name).replaceAll("\\", "/")),
    ).size !== files.length
  )
    throw new Error("Monaco model paths must be unique within a workspace.");
  const prefix = `inmemory://moyaforge/${encodeURIComponent(id)}/`;
  const root = useRef<HTMLDivElement>(null);
  const runtime = useRef<Parameters<OnMount>[1] | null>(null);
  const automaticTheme = useEditorTheme(root, theme);
  useEffect(
    () => () => {
      // Let the child editor detach before disposing all owned models, including
      // inactive tabs. Disposing a model still attached to an editor cancels work.
      const monaco = runtime.current;
      queueMicrotask(() => {
        for (const model of monaco?.editor.getModels() ?? [])
          if (model.uri.toString().startsWith(prefix) && !model.isDisposed())
            model.dispose();
      });
    },
    [prefix],
  );
  return (
    <div
      ref={root}
      data-moyaforge-monaco-workspace=""
      style={{ width, minWidth: 0 }}
    >
      <MonacoFileSession
        files={files}
        activeFile={activeFile}
        onFileChange={onFileChange}
        className={className}
        readOnly={sessionReadOnly ?? options?.readOnly ?? false}
        renderEditor={({ file, value, onChange, readOnly }) => (
          <ReactMonacoSourceEditor
            {...editorProps}
            path={
              prefix +
              (file.path ?? file.name)
                .replaceAll("\\", "/")
                .split("/")
                .map(encodeURIComponent)
                .join("/")
            }
            language={file.language}
            value={value}
            height={height}
            keepCurrentModel
            theme={theme ?? automaticTheme}
            loading={loading}
            beforeMount={beforeMount}
            onMount={(editor, monaco) => {
              runtime.current = monaco;
              onMount?.(editor, monaco);
            }}
            onChange={(next, event) => {
              if (next !== undefined && !readOnly) onChange(next);
              onEditorChange?.(next, event);
            }}
            options={{
              fixedOverflowWidgets: true,
              ...options,
              readOnly,
              domReadOnly: readOnly,
            }}
          />
        )}
      />
    </div>
  );
}
