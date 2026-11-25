// Vite example: keep the editor runtime and workers local, without a CDN.
import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";

// Syntax highlighting (basic-languages) and language services (language/*).
import "monaco-editor/esm/vs/basic-languages/css/css.contribution";
import "monaco-editor/esm/vs/basic-languages/html/html.contribution";
import "monaco-editor/esm/vs/language/css/monaco.contribution";
import "monaco-editor/esm/vs/language/html/monaco.contribution";

import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker.js?worker";
import TypeScriptWorker from "monaco-editor/esm/vs/language/typescript/ts.worker.js?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker.js?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker.js?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker.js?worker";

import reactWorkerLibraries from "virtual:moyaforge-monaco/react-types";

const environment = globalThis as typeof globalThis & {
  MonacoEnvironment?: monaco.Environment;
};
let configured = false;

/**
 * Configure standalone React Monaco with local Vite workers and React TSX types.
 * Call before mounting editors. Subsequent calls are no-ops.
 * @param options - Native Monaco environment settings. A host getWorker or getWorkerUrl takes precedence over defaults.
 * @throws If a TypeFox worker factory is already configured.
 * @returns Nothing; updates the loader, compiler defaults and global worker factory.
 */
export function configureReactWorkers(options: monaco.Environment = {}) {
  if (configured) return;
  // Monaco prefers getWorker over TypeFox's getWorkerUrl. Never silently
  // replace an existing VS Code-compatible worker factory.
  if (typeof (environment.MonacoEnvironment as (monaco.Environment & { getWorkerOptions?: unknown }) | undefined)?.getWorkerOptions === "function") {
    throw new Error(
      "TypeFox workers are already configured. Use initializeSharedMonaco() before mounting either editor.",
    );
  }
  loader.config({ monaco });

  // Newer monaco-editor versions expose `monaco.typescript`;
  // older ones only have `monaco.languages.typescript`.
  const tsApi: typeof monaco.languages.typescript =
    (monaco as any).typescript ?? monaco.languages.typescript;

  const { typescriptDefaults, ModuleResolutionKind, JsxEmit, ScriptTarget } =
    tsApi;

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
      "react/jsx-runtime": [
        "file:///node_modules/@types/react/jsx-runtime.d.ts",
      ],
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

  const hostEnvironment = environment.MonacoEnvironment;
  const nextEnvironment = { ...hostEnvironment, ...options };
  // A native host factory takes precedence over our defaults, including URL-based factories.
  if (!nextEnvironment.getWorker && !nextEnvironment.getWorkerUrl) {
    nextEnvironment.getWorker = getDefaultReactWorker;
  }
  environment.MonacoEnvironment = nextEnvironment;
  configured = true;
}

/**
 * Create a built-in Monaco worker using the native Environment.getWorker signature.
 * Delegate unhandled labels to this function from a host-supplied worker factory.
 * @param _moduleId - Monaco worker module identifier.
 * @param label - Monaco worker label.
 * @returns Browser Worker for the requested language service or the editor fallback.
 */
export const getDefaultReactWorker: NonNullable<monaco.Environment["getWorker"]> =
  (_moduleId, label) => {
    if (label === "typescript" || label === "javascript")
      return new TypeScriptWorker();
    if (["css", "scss", "less"].includes(label)) return new CssWorker();
    if (label === "json") return new JsonWorker();
    if (["html", "handlebars", "razor"].includes(label)) return new HtmlWorker();
    return new EditorWorker();
  };

export { monaco };
