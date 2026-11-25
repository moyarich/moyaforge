// VS Code-compatible standalone language contributions and worker registration.
import "@codingame/monaco-vscode-standalone-languages";
import type { CompilerOptions } from "@codingame/monaco-vscode-standalone-typescript-language-features";
import * as vscodeTypeScript from "@codingame/monaco-vscode-standalone-typescript-language-features";
import "@codingame/monaco-vscode-standalone-css-language-features";
import "@codingame/monaco-vscode-standalone-json-language-features";
import "@codingame/monaco-vscode-standalone-html-language-features";
import { useWorkerFactory, type WorkerFactoryConfig } from "monaco-languageclient/workerFactory";

import { configureTypeScript } from "./configureTypeScript.js";
import { createMonacoVscodeWorkerConfig } from "./createMonacoVscodeWorkerConfig.js";

export interface TypeFoxWorkerConfig extends WorkerFactoryConfig {
  typescript?: {
    compilerOptions?: CompilerOptions;
    /** Declaration source keyed by its virtual file URI. */
    declarationLibraries?: Readonly<Record<string, string>>;
  };
}

let configured = false;

/**
 * Register VS Code-compatible TypeFox workers using host-bundled Vite URLs.
 * Call before mounting editors. Subsequent calls are no-ops.
 * @param config - Worker factory options and optional TypeScript compiler overrides and declaration libraries.
 * @throws If a standalone Monaco getWorker factory is already configured.
 * @returns Nothing; installs the worker factory and TypeScript defaults.
 */
export function configureTypeFoxWorkers({
  typescript,
  ...workerConfig
}: TypeFoxWorkerConfig = {}) {
  if (configured) return;
  // getWorker has priority over TypeFox's getWorkerUrl. Do not mutate
  // another editor integration's global worker configuration.
  const environment = globalThis as typeof globalThis & {
    MonacoEnvironment?: { getWorker?: unknown };
  };
  if (typeof environment.MonacoEnvironment?.getWorker === "function") {
    throw new Error(
      "Standalone Monaco workers are already configured. Use initializeMonacoVscodeRuntime() before mounting either editor.",
    );
  }
  const { typescriptDefaults } = vscodeTypeScript;
  const typeScript = configureTypeScript({
    api: vscodeTypeScript,
    currentCompilerOptions: typescriptDefaults.getCompilerOptions(),
    ...typescript,
  });
  typescriptDefaults.setCompilerOptions(typeScript.compilerOptions);
  for (const [filePath, content] of Object.entries(typeScript.declarationLibraries)) {
    typescriptDefaults.addExtraLib(content, filePath);
  }
  useWorkerFactory(createMonacoVscodeWorkerConfig(workerConfig));
  configured = true;
}
