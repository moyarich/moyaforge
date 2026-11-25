import * as monaco from "@codingame/monaco-vscode-editor-api";
import { loader } from "@monaco-editor/react";
import { MonacoVscodeApiWrapper } from "monaco-languageclient/vscodeApiWrapper";
import type { WorkerFactoryConfig } from "monaco-languageclient/workerFactory";
import { configureTypeFoxWorkers } from "../workers/configureTypeFoxWorkers.js";

let initialization: Promise<void> | undefined;

/**
 * Initialize one VS Code-compatible runtime for React Monaco and TypeFox.
 * Await this before mounting editors; do not also configure standalone workers.
 * @param config - Native TypeFox worker factory configuration used for the first initialization.
 * @returns Cached promise that resolves when shared VS Code services have started.
 * @throws Via promise rejection if startup fails or a competing worker factory exists.
 * @example await initializeSharedMonaco();
 */
export function initializeSharedMonaco(config: WorkerFactoryConfig = {}): Promise<void> {
  return (initialization ??= (async () => {
    // TypeFox owns getWorkerUrl/getWorkerOptions. A pre-existing getWorker
    // would take priority, so configureTypeFoxWorkers() rejects that case.
    configureTypeFoxWorkers(config);
    loader.config({
      monaco: monaco as unknown as typeof import("monaco-editor"),
    });

    await new MonacoVscodeApiWrapper({
      $type: "classic",
      viewsConfig: { $type: "EditorService" },
      // Workers are already configured above.
      monacoWorkerFactory: () => {},
    }).start();
  })());
}
