// Install these optional language features at the same version as the VS Code API:
// npm install @codingame/monaco-vscode-standalone-languages@^37.6.1 @codingame/monaco-vscode-standalone-typescript-language-features@^37.6.1 @codingame/monaco-vscode-standalone-css-language-features@^37.6.1 @codingame/monaco-vscode-standalone-json-language-features@^37.6.1 @codingame/monaco-vscode-standalone-html-language-features@^37.6.1
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

import reactWorkerLibraries from "virtual:moyaforge-monaco/react-types";

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

let configured = false;

export function configureTypeFoxWorkers() {
  if (configured) return;
  // The gallery can navigate between independent Monaco engines.
  const environment = globalThis as typeof globalThis & {
    MonacoEnvironment?: { getWorker?: unknown };
  };
  if (environment.MonacoEnvironment)
    delete environment.MonacoEnvironment.getWorker;
  const editorWorker = () =>
    new Worker(
      new URL(
        "@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js",
        import.meta.url,
      ),
      { type: "module" },
    );
  const languageWorker = (specifier: string) =>
    new Worker(new URL(specifier, import.meta.url), { type: "module" });

  const typescriptWorker = () =>
    languageWorker(
      "@codingame/monaco-vscode-standalone-typescript-language-features/worker",
    );
  const cssWorker = () =>
    languageWorker(
      "@codingame/monaco-vscode-standalone-css-language-features/worker",
    );
  const htmlWorker = () =>
    languageWorker(
      "@codingame/monaco-vscode-standalone-html-language-features/worker",
    );

  useWorkerFactory({
    workerLoaders: {
      editorWorkerService: editorWorker,
      typescript: typescriptWorker,
      javascript: typescriptWorker,
      css: cssWorker,
      scss: cssWorker,
      less: cssWorker,
      json: () =>
        languageWorker(
          "@codingame/monaco-vscode-standalone-json-language-features/worker",
        ),
      html: htmlWorker,
      handlebars: htmlWorker,
      razor: htmlWorker,
    },
  });
  configured = true;
}
