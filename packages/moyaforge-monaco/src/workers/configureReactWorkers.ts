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

import { configureTypeScript } from "./configureTypeScript.js";

const environment = globalThis as typeof globalThis & {
  MonacoEnvironment?: monaco.Environment;
};
let configured = false;

/**
 * Configure standalone React Monaco with local Vite workers and React TSX types.
 * Call before mounting editors. Subsequent calls are no-ops.
 * @param options - Native Monaco environment settings and optional TypeScript compiler overrides and declaration libraries.
 * A host getWorker or getWorkerUrl takes precedence over defaults.
 * @throws If a TypeFox worker factory is already configured.
 * @returns Nothing; updates the loader, compiler defaults and global worker factory.
 */
export function configureReactWorkers({
  typescript,
  ...options
}: monaco.Environment & {
  typescript?: {
    compilerOptions?: monaco.languages.typescript.CompilerOptions;
    /** Declaration source keyed by its virtual file URI. */
    declarationLibraries?: Readonly<Record<string, string>>;
  };
} = {}) {
  if (configured) return;
  // Monaco prefers getWorker over TypeFox's getWorkerUrl. Never silently
  // replace an existing VS Code-compatible worker factory.
  if (typeof (environment.MonacoEnvironment as (monaco.Environment & { getWorkerOptions?: unknown }) | undefined)?.getWorkerOptions === "function") {
    throw new Error(
      "TypeFox workers are already configured. Use initializeMonacoVscodeRuntime() before mounting either editor.",
    );
  }
  loader.config({ monaco });

  const { typescriptDefaults } = monaco.languages.typescript;
  const typeScript = configureTypeScript({
    api: monaco.languages.typescript,
    currentCompilerOptions: typescriptDefaults.getCompilerOptions(),
    ...typescript,
  });
  typescriptDefaults.setCompilerOptions(typeScript.compilerOptions);
  for (const [filePath, content] of Object.entries(typeScript.declarationLibraries)) {
    typescriptDefaults.addExtraLib(content, filePath);
  }

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
