import * as monaco from "@codingame/monaco-vscode-editor-api";
import { loader } from "@monaco-editor/react";
import { MonacoVscodeApiWrapper } from "monaco-languageclient/vscodeApiWrapper";
import { isSharedMonacoRuntime, markSharedMonacoRuntime } from "./runtime.js";
import { configureTypeFoxWorkers } from "./typefox.js";

let initialization: Promise<void> | undefined;

/**
 * Both editors use the same VS Code-compatible Monaco API and worker protocol.
 * The standalone getWorker provider cannot coexist with getWorkerUrl: Monaco
 * always prefers getWorker, even when both callbacks exist.
 */
export function configureSharedMonacoWorkers() {
  if (isSharedMonacoRuntime()) return;

  const environment = globalThis as typeof globalThis & {
    MonacoEnvironment?: { getWorker?: unknown };
  };
  if (environment.MonacoEnvironment) delete environment.MonacoEnvironment.getWorker;

  configureTypeFoxWorkers();
  loader.config({ monaco: monaco as unknown as typeof import("monaco-editor") });
  markSharedMonacoRuntime();
}

/**
 * Await once before mounting either React Monaco or TypeFox, since VS Code
 * services must initialize before the first Monaco editor is created.
 */
export function initializeSharedMonaco(): Promise<void> {
  configureSharedMonacoWorkers();
  return (initialization ??= new MonacoVscodeApiWrapper({
    $type: "classic",
    viewsConfig: { $type: "EditorService" },
    // The compatible worker URLs/options are already installed above.
    monacoWorkerFactory: () => {},
  }).start());
}
