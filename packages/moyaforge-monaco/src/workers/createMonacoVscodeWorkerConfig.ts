import { Worker, type WorkerFactoryConfig } from "monaco-languageclient/workerFactory";

// Delegate worker URL generation to the consuming Vite application. Library
// builds cannot bake in /assets/*.js URLs: those files are not served from
// the application's root by the development server.
import EditorWorkerUrl from "@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js?worker&url";
import TypeScriptWorkerUrl from "@codingame/monaco-vscode-standalone-typescript-language-features/worker?worker&url";
import CssWorkerUrl from "@codingame/monaco-vscode-standalone-css-language-features/worker?worker&url";
import JsonWorkerUrl from "@codingame/monaco-vscode-standalone-json-language-features/worker?worker&url";
import HtmlWorkerUrl from "@codingame/monaco-vscode-standalone-html-language-features/worker?worker&url";

/** Build lazy worker loaders without installing them on the Monaco runtime. */
export function createMonacoVscodeWorkerConfig(
  config: WorkerFactoryConfig = {},
): WorkerFactoryConfig {
  // ?worker&url imports let the consuming Vite app bundle and serve
  // every worker while retaining monaco-languageclient's Worker metadata.
  const editorWorker = () =>
    new Worker(new URL(EditorWorkerUrl, import.meta.url), { type: "module" });
  const typescriptWorker = () =>
    new Worker(new URL(TypeScriptWorkerUrl, import.meta.url), {
      type: "module",
    });
  const cssWorker = () =>
    new Worker(new URL(CssWorkerUrl, import.meta.url), { type: "module" });
  const htmlWorker = () =>
    new Worker(new URL(HtmlWorkerUrl, import.meta.url), { type: "module" });

  return {
    ...config,
    workerLoaders: {
      editorWorkerService: editorWorker,
      typescript: typescriptWorker,
      javascript: typescriptWorker,
      css: cssWorker,
      scss: cssWorker,
      less: cssWorker,
      json: () =>
        new Worker(new URL(JsonWorkerUrl, import.meta.url), {
          type: "module",
        }),
      html: htmlWorker,
      handlebars: htmlWorker,
      razor: htmlWorker,
      ...config.workerLoaders,
    },
  };
}
