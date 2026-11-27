import "./CodeRunner.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContainer, EditorToolbar, EditorTools, EditorContent } from "../EditorContainer/index.js";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../ResizablePanel/index.js";

export type CodeRunnerState<T> =
  | { status: "idle" }
  | { status: "running" }
  | { status: "success"; output: T }
  | { status: "error"; error: unknown };

export interface CodeRunnerEditorProps {
  source: string;
  onSourceChange: (source: string) => void;
  run: () => void;
}

export interface CodeRunnerOutputProps<T> {
  state: CodeRunnerState<T>;
  clear: () => void;
}

export interface CodeRunnerProps<T> {
  initialSource: string;
  runSource: (source: string, signal: AbortSignal) => T | Promise<T>;
  renderOutput: (props: CodeRunnerOutputProps<T>) => ReactNode;
  renderEditor?: (props: CodeRunnerEditorProps) => ReactNode;
  editorTitle?: string;
  outputTitle?: string;
  className?: string;
  direction?: "horizontal" | "vertical";
}

/** Execution and output presentation are entirely owned by the consumer. */
export function CodeRunner<T>({
  initialSource,
  runSource,
  renderOutput,
  renderEditor,
  editorTitle = "Source",
  outputTitle = "Output",
  className,
  direction = "horizontal",
}: CodeRunnerProps<T>) {
  const [source, setSource] = useState(initialSource);
  const [state, setState] = useState<CodeRunnerState<T>>({ status: "idle" });
  const active = useRef<AbortController | null>(null);

  useEffect(() => () => active.current?.abort(), []);

  function clear() {
    active.current?.abort();
    active.current = null;
    setState({ status: "idle" });
  }

  async function run() {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setState({ status: "running" });
    try {
      const output = await runSource(source, controller.signal);
      if (!controller.signal.aborted && active.current === controller) {
        setState({ status: "success", output });
      }
    } catch (error) {
      if (!controller.signal.aborted && active.current === controller) {
        setState({ status: "error", error });
      }
    } finally {
      if (active.current === controller) active.current = null;
    }
  }

  return (
    <EditorContainer
      className={["mf-code-runner", className].filter(Boolean).join(" ")}
      onKeyDownCapture={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          void run();
        }
      }}
    >
      <ResizablePanelGroup direction={direction}>
        <ResizablePanel defaultSize={55} minSize={20}>
          <section className="mf-code-runner-pane" aria-label={editorTitle}>
            <EditorToolbar>
              <strong>{editorTitle}</strong>
              <EditorTools>
                <button type="button" onClick={() => setSource(initialSource)}>Reset</button>
                <button type="button" onClick={() => void run()}>Run</button>
              </EditorTools>
            </EditorToolbar>
            <EditorContent>
              {renderEditor ? renderEditor({ source, onSourceChange: setSource, run: () => void run() }) : (
                <textarea
                  aria-label={editorTitle}
                  value={source}
                  spellCheck={false}
                  onChange={(event) => setSource(event.target.value)}
                />
              )}
            </EditorContent>
          </section>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize source and output" />
        <ResizablePanel defaultSize={45} minSize={20}>
          <section className="mf-code-runner-pane" aria-label={outputTitle} aria-busy={state.status === "running"}>
            <EditorToolbar>
              <strong>{outputTitle}</strong>
              <EditorTools>
                <button type="button" disabled={state.status === "idle"} onClick={clear}>Clear</button>
              </EditorTools>
            </EditorToolbar>
            <div className="mf-code-runner-output">
              <span className="mf-code-runner-status" role="status">{state.status === "running" ? "Running…" : state.status === "error" ? "Execution failed" : state.status === "success" ? "Run complete" : "Ready to run"}</span>
              {renderOutput({ state, clear })}
            </div>
          </section>
        </ResizablePanel>
      </ResizablePanelGroup>
    </EditorContainer>
  );
}
