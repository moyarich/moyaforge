import "../../styles/MonacoLoading.css";
import { useEditorTheme } from "../../hooks/useEditorTheme.js";
import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { MonacoEditorReactComp } from "@typefox/monaco-editor-react";
import type { MonacoEditorProps } from "@typefox/monaco-editor-react";
import type { editor } from "@codingame/monaco-vscode-editor-api";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import {
  MonacoFileSession,
  type MonacoFileSessionProps,
  type MonacoFileRenderProps,
} from "../MonacoFileSession/MonacoFileSession.js";

/** Configuration for the headless editor runtime. */
export interface MonacoEditorTypeFoxProps extends Omit<
  MonacoFileSessionProps,
  "renderEditor"
>, MonacoEditorProps {
  /** Editor height; defaults to 320. */
  height?: number | string;
  /** Container width; defaults to 100%. */
  width?: number | string;
  /** Optional Monaco theme; omit to follow the host appearance. */
  theme?: string;
  /** Native Monaco construction options; file locks take precedence. */
  options?: editor.IStandaloneEditorConstructionOptions;
  /** Called when the editor starts. */
  onReady?: MonacoEditorProps["onEditorStartDone"];
}
const defaultApiConfig: MonacoVscodeApiConfig = {
  $type: "classic",
  viewsConfig: { $type: "EditorService" },
  // Worker setup belongs to the host; preserve its configured environment.
  monacoWorkerFactory: () => {},
};

function TypeFoxEditor({
  file,
  value,
  readOnly,
  onChange,
  height,
  theme,
  options,
  vscodeApiConfig,
  languageClientConfig,
  onReady,
  onError,
  uri,
  editorAppConfig,
  triggerReprocessConfig,
  onEditorStartDone,
  onTextChanged,
  style,
  files: _files,
  activeFile: _activeFile,
  onFileChange: _onFileChange,
  className: _className,
  width: _width,
  ...nativeProps
}: MonacoFileRenderProps & MonacoEditorTypeFoxProps & { uri: string }) {
  const current = useRef(value);
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (current.current !== value) {
      current.current = value;
      setRevision((previous) => previous + 1);
    }
  }, [value]);
  useEffect(() => {
    setRevision((previous) => previous + 1);
  }, [theme, options, readOnly, editorAppConfig, file.language, triggerReprocessConfig]);
  return (
    <div style={{ height, minHeight: 0, position: "relative" }}>
      {!ready && !error && (
        <div
          data-moyaforge-monaco-loading=""
          className="mf-monaco-loading"
          role="status"
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
        >
          <LoaderCircle size={16} aria-hidden="true" />
          Loading editor…
        </div>
      )}
      {error && <p role="alert">{error.message}</p>}
      <MonacoEditorReactComp
        {...nativeProps}
        style={{ height: "100%", ...style }}
        vscodeApiConfig={vscodeApiConfig ?? defaultApiConfig}
        languageClientConfig={languageClientConfig}
        editorAppConfig={{
          ...editorAppConfig,
          id: uri,
          codeResources: {
            ...editorAppConfig?.codeResources,
            modified: {
              text: value,
              uri,
              ...(file.language !== undefined && { enforceLanguageId: file.language }),
            },
          },
          editorOptions: {
            fontSize: 13,
            lineHeight: 22,
            minimap: { enabled: false },
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fixedOverflowWidgets: true,
            wordWrap: "on",
            ...editorAppConfig?.editorOptions,
            ...options,
            ...(theme !== undefined && { theme }),
            readOnly,
            domReadOnly: readOnly,
          },
        }}
        triggerReprocessConfig={revision}
        onEditorStartDone={(app) => {
          setReady(true);
          onEditorStartDone?.(app);
          onReady?.(app);
        }}
        onError={(next) => {
          setError(next);
          onError?.(next);
        }}
        onTextChanged={(changes) => {
          const { modified } = changes;
          if (modified !== undefined && !readOnly) {
            current.current = modified;
            onChange(modified);
          }
          onTextChanged?.(changes);
        }}
      />
    </div>
  );
}

/** Multi-file editor backed by TypeFox's Monaco and VS Code services. */
export function MonacoEditorTypeFox({
  height = 320,
  width = "100%",
  theme,
  options,
  vscodeApiConfig,
  languageClientConfig,
  onReady,
  onError,
  ...props
}: MonacoEditorTypeFoxProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const resolvedTheme = useEditorTheme(root, theme);
  const paths = props.files.map((file) =>
    (file.path ?? file.name).replaceAll("\\", "/"),
  );
  if (new Set(paths).size !== paths.length)
    throw new Error("Monaco model paths must be unique within a workspace.");
  return (
    <div
      ref={root}
      data-moyaforge-monaco-workspace=""
      style={{ width, minWidth: 0 }}
    >
      <MonacoFileSession
        {...props}
        readOnly={props.readOnly ?? options?.readOnly ?? props.editorAppConfig?.editorOptions?.readOnly ?? false}
        renderEditor={(state) => (
          <TypeFoxEditor
            key={state.file.name}
            {...props}
            {...state}
            height={height}
            theme={resolvedTheme}
            options={options}
            vscodeApiConfig={vscodeApiConfig}
            languageClientConfig={languageClientConfig}
            onReady={onReady}
            onError={onError}
            uri={`file:///moyaforge/${encodeURIComponent(id)}/${(state.file.path ?? state.file.name).replaceAll("\\", "/").split("/").map(encodeURIComponent).join("/")}`}
          />
        )}
      />
    </div>
  );
}
