import "./PreviewCodeEditor.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Play, RotateCcw } from "lucide-react";
import {
  Preview, PreviewActions, PreviewCodeToggle, PreviewContent,
  PreviewHeader, PreviewSource, PreviewTitle,
} from "../Preview/index.js";
import { MonacoEditorPanel } from "../MonacoEditorPanel/index.js";
import type { MonacoEditorReactProps, MonacoFile } from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../ResizablePanel/index.js";

export type PreviewExecutionState<T> =
  | { status: "idle" }
  | { status: "running" }
  | { status: "success"; output: T }
  | { status: "error"; error: unknown };

export interface PreviewExecutionOutputProps<T> {
  state: PreviewExecutionState<T>;
  clear: () => void;
}

interface PreviewCodeEditorBaseProps {
  title: string;
  files: readonly MonacoFile[];
  usageSource?: string;
  usageFileName?: string;
  height?: number | string;
  options?: MonacoEditorReactProps["options"];
  tools?: ReactNode;
  showBreadcrumbs?: boolean;
  renderBreadcrumbs?: (file: MonacoFile) => ReactNode;
}

export type PreviewCodeEditorProps<T = unknown> = PreviewCodeEditorBaseProps & (
  | {
      renderPreview: (files: readonly MonacoFile[]) => ReactNode;
      runSource?: never;
      renderOutput?: never;
      direction?: never;
    }
  | {
      renderPreview?: never;
      runSource: (files: readonly MonacoFile[], signal: AbortSignal) => T | Promise<T>;
      renderOutput: (props: PreviewExecutionOutputProps<T>) => ReactNode;
      direction?: "horizontal" | "vertical";
    }
);

/** Live preview or explicit execution with consumer-owned output. */
export function PreviewCodeEditor<T = unknown>({
  title, files, renderPreview, runSource, renderOutput, direction = "horizontal", usageSource,
  usageFileName = "PreviewCodeEditor.tsx", height = 320, options,
  tools, showBreadcrumbs = false, renderBreadcrumbs,
}: PreviewCodeEditorProps<T>) {
  const [initialFiles] = useState(() => files.map(file => ({ ...file })));
  const [currentFiles, setCurrentFiles] = useState(() => files.map(file => ({ ...file })));
  const [execution, setExecution] = useState<PreviewExecutionState<T>>({ status: "idle" });
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);

  function clear() {
    active.current?.abort();
    active.current = null;
    setExecution({ status: "idle" });
  }

  async function run() {
    if (!runSource) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setExecution({ status: "running" });
    try {
      const output = await runSource(currentFiles.map(file => ({ ...file })), controller.signal);
      if (!controller.signal.aborted && active.current === controller)
        setExecution({ status: "success", output });
    } catch (error) {
      if (!controller.signal.aborted && active.current === controller)
        setExecution({ status: "error", error });
    } finally {
      if (active.current === controller) active.current = null;
    }
  }

  const editorFiles: MonacoFile[] = usageSource
    ? [{ name: usageFileName, language: "typescript", value: usageSource, readOnly: true }, ...currentFiles]
    : currentFiles;
  const unchanged = currentFiles.length === initialFiles.length &&
    currentFiles.every((file, index) =>
      file.name === initialFiles[index]?.name && file.value === initialFiles[index]?.value);
  const editor = (
    <MonacoEditorPanel
            files={editorFiles}
            defaultActiveFile={currentFiles.find(file => !file.readOnly)?.name}
            height={height}
            options={{ fixedOverflowWidgets: true, ...options }}
            showBreadcrumbs={showBreadcrumbs}
            renderBreadcrumbs={renderBreadcrumbs}
            tools={tools}
            onFileChange={(name, value) => {
              setCurrentFiles(current => current.map(file =>
                file.name === name ? { ...file, value } : file));
            }}
          />
  );
  return (
    <Preview title={title} source={usageSource ?? currentFiles[0]?.value}
      onKeyDownCapture={event => {
        if (runSource && (event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          void run();
        }
      }}>
      <PreviewHeader>
        <PreviewTitle>{title}</PreviewTitle>
        <PreviewActions>
          {!runSource && <PreviewCodeToggle />}
          {runSource && <button type="button" className="mf-preview-action" onClick={() => void run()}>
            <Play size={15} aria-hidden="true" />Run
          </button>}
          {runSource && <button type="button" className="mf-preview-action" disabled={execution.status === "idle"} onClick={clear}>Clear output</button>}
          <button type="button" className="mf-preview-action" disabled={unchanged}
            onClick={() => {
              setCurrentFiles(initialFiles.map(file => ({ ...file })));
              if (runSource) clear();
            }}>
            <RotateCcw size={15} aria-hidden="true" />Reset code
          </button>
        </PreviewActions>
      </PreviewHeader>
      {runSource && renderOutput ? (
        <PreviewContent asChild>
          <div className="mf-preview-code-editor-workspace">
            <ResizablePanelGroup direction={direction}>
              <ResizablePanel defaultSize={55} minSize={20}>
                <div className="mf-preview-code-editor-source">{editor}</div>
              </ResizablePanel>
              <ResizableHandle aria-label="Resize source and output" />
              <ResizablePanel defaultSize={45} minSize={20}>
                <section className="mf-preview-code-editor-output" aria-label="Output" aria-busy={execution.status === "running"}>
                  <p role="status">{execution.status === "running" ? "Running…" : execution.status === "error" ? "Execution failed" : execution.status === "success" ? "Run complete" : "Ready to run"}</p>
                  {renderOutput({ state: execution, clear })}
                </section>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </PreviewContent>
      ) : (
        <PreviewContent asChild>
          <div className="mf-preview-code-editor-stage">{renderPreview?.(currentFiles)}</div>
        </PreviewContent>
      )}
      {!runSource && <PreviewSource asChild>
        <div className="mf-preview-code-editor-source">{editor}</div>
      </PreviewSource>}
    </Preview>
  );
}
