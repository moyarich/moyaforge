import * as monaco from "@codingame/monaco-vscode-editor-api";
import { loader } from "@monaco-editor/react";
import { MonacoVscodeApiWrapper } from "monaco-languageclient/vscodeApiWrapper";
import {
  configureTypeFoxWorkers,
  type TypeFoxWorkerConfig,
} from "../workers/configureTypeFoxWorkers.js";

let initialization: Promise<void> | undefined;

/**
 * Initialize one VS Code-compatible runtime for React Monaco and TypeFox.
 * Await this before mounting editors; do not also configure standalone workers.
 * Configures workers, points the React editor at the VS Code-compatible Monaco instance, and starts VS Code services
 * @param config - Worker factory and TypeScript compiler options used for the first initialization.
 * @returns Cached promise that resolves when shared VS Code services have started.
 * @throws Via promise rejection if startup fails or a competing worker factory exists.
 * @example await initializeMonacoVscodeRuntime();
 */
export function initializeMonacoVscodeRuntime(
  config: TypeFoxWorkerConfig = {},
): Promise<void> {
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
