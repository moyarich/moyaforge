import * as monaco from "@codingame/monaco-vscode-editor-api";
import { loader } from "@monaco-editor/react";
import { MonacoVscodeApiWrapper } from "monaco-languageclient/vscodeApiWrapper";
import { configureTypeFoxWorkers } from "./typefox.js";

let initialization: Promise<void> | undefined;

/** Configure one VS Code-compatible runtime before mounting either editor. */
export function initializeSharedMonaco(): Promise<void> {
  return (initialization ??= (async () => {
    // TypeFox owns getWorkerUrl/getWorkerOptions. A pre-existing getWorker
    // would take priority, so configureTypeFoxWorkers() rejects that case.
    configureTypeFoxWorkers();
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
