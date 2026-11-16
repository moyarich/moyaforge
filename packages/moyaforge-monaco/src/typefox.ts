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
import { useWorkerFactory } from "monaco-languageclient/workerFactory";

// Delegate worker URL generation to the consuming Vite application. Library
// builds cannot bake in /assets/*.js URLs: those files are not served from
// the application's root by the development server.
import EditorWorker from "@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js?worker";
import TypeScriptWorker from "@codingame/monaco-vscode-standalone-typescript-language-features/worker?worker";
import CssWorker from "@codingame/monaco-vscode-standalone-css-language-features/worker?worker";
import JsonWorker from "@codingame/monaco-vscode-standalone-json-language-features/worker?worker";
import HtmlWorker from "@codingame/monaco-vscode-standalone-html-language-features/worker?worker";

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

  // ?worker imports are resolved by Vite at the application boundary. This
  // works for linked/workspace packages in dev and installed tarballs in builds.
  const editorWorker = () => new EditorWorker();
  const typescriptWorker = () => new TypeScriptWorker();
  const cssWorker = () => new CssWorker();
  const htmlWorker = () => new HtmlWorker();

  useWorkerFactory({
    workerLoaders: {
      editorWorkerService: editorWorker,
      typescript: typescriptWorker,
      javascript: typescriptWorker,
      css: cssWorker,
      scss: cssWorker,
      less: cssWorker,
      json: () => new JsonWorker(),
      html: htmlWorker,
      handlebars: htmlWorker,
      razor: htmlWorker,
    },
  });
  configured = true;
}
