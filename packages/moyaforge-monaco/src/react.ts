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

import reactWorkerLibraries from "virtual:monaco-react-types";

const environment = globalThis as typeof globalThis & {
  MonacoEnvironment?: monaco.Environment;
};
let configured = false;

export function configureReactWorkers() {
  if (configured) return;
  configured = true;

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

  environment.MonacoEnvironment = {
    ...environment.MonacoEnvironment,
    getWorker(_moduleId, label) {
      if (label === "typescript" || label === "javascript")
        return new TypeScriptWorker();
      if (["css", "scss", "less"].includes(label)) return new CssWorker();
      if (label === "json") return new JsonWorker();
      if (["html", "handlebars", "razor"].includes(label))
        return new HtmlWorker();
      return new EditorWorker();
    },
  };
}

loader.config({ monaco });

export { monaco };
