// VS Code-compatible standalone language contributions and worker registration.
import "@codingame/monaco-vscode-standalone-languages";
import {
  JsxEmit,
  ModuleResolutionKind,
  ScriptTarget,
  typescriptDefaults,
} from "@codingame/monaco-vscode-standalone-typescript-language-features";
import "@codingame/monaco-vscode-standalone-css-language-features";
import "@codingame/monaco-vscode-standalone-json-language-features";
import "@codingame/monaco-vscode-standalone-html-language-features";
import { useWorkerFactory, Worker } from "monaco-languageclient/workerFactory";

// Delegate worker URL generation to the consuming Vite application. Library
// builds cannot bake in /assets/*.js URLs: those files are not served from
// the application's root by the development server.
import EditorWorkerUrl from "@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js?worker&url";
import TypeScriptWorkerUrl from "@codingame/monaco-vscode-standalone-typescript-language-features/worker?worker&url";
import CssWorkerUrl from "@codingame/monaco-vscode-standalone-css-language-features/worker?worker&url";
import JsonWorkerUrl from "@codingame/monaco-vscode-standalone-json-language-features/worker?worker&url";
import HtmlWorkerUrl from "@codingame/monaco-vscode-standalone-html-language-features/worker?worker&url";

import reactWorkerLibraries from "virtual:moyaforge-monaco/react-types";

function configureTypeScript() {
  typescriptDefaults.setCompilerOptions({
    ...typescriptDefaults.getCompilerOptions(),
    target: ScriptTarget.ESNext,
    moduleResolution: ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    // Needed for `import React from "react"` (@types/react uses `export =`)
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    paths: {
      react: ["file:///node_modules/@types/react/index.d.ts"],
      "react/jsx-runtime": ["file:///node_modules/@types/react/jsx-runtime.d.ts"],
      "react/jsx-dev-runtime": [
        "file:///node_modules/@types/react/jsx-dev-runtime.d.ts",
      ],
      "react-dom": ["file:///node_modules/@types/react-dom/index.d.ts"],
      "react-dom/client": ["file:///node_modules/@types/react-dom/client.d.ts"],
      csstype: ["file:///node_modules/csstype/index.d.ts"],
    },
    jsx: JsxEmit.ReactJSX,
  });

  for (const [filePath, content] of Object.entries(reactWorkerLibraries)) {
    typescriptDefaults.addExtraLib(content, filePath);
  }

  typescriptDefaults.addExtraLib(
    'declare module "*.css" {}',
    "file:///types/styles.d.ts",
  );
}

let configured = false;

export function configureTypeFoxWorkers() {
  if (configured) return;
  // getWorker has priority over TypeFox's getWorkerUrl. Do not mutate
  // another editor integration's global worker configuration.
  const environment = globalThis as typeof globalThis & {
    MonacoEnvironment?: { getWorker?: unknown };
  };
  if (typeof environment.MonacoEnvironment?.getWorker === "function") {
    throw new Error(
      "Standalone Monaco workers are already configured. Use initializeSharedMonaco() before mounting either editor.",
    );
  }
  configureTypeScript();

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

  useWorkerFactory({
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
    },
  });
  configured = true;
}
