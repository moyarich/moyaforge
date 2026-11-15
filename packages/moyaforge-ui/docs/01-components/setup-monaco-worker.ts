// Vite example: keep the editor runtime and workers local, without a CDN.
import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker.js?worker";
import TypeScriptWorker from "monaco-editor/esm/vs/language/typescript/ts.worker.js?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker.js?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker.js?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker.js?worker";

import reactTypes from "../../../../node_modules/@types/react/index.d.ts?raw";
import reactGlobalTypes from "../../../../node_modules/@types/react/global.d.ts?raw";
import jsxRuntimeTypes from "../../../../node_modules/@types/react/jsx-runtime.d.ts?raw";
import cssTypes from "../../../../node_modules/csstype/index.d.ts?raw";

const reactWorkerLibraries = [
  { filePath: "file:///types/react/index.d.ts", content: reactTypes },
  { filePath: "file:///types/react/global.d.ts", content: reactGlobalTypes },
  { filePath: "file:///types/react/jsx-runtime.d.ts", content: jsxRuntimeTypes },
  { filePath: "file:///types/css/index.d.ts", content: cssTypes },
];

const environment = globalThis as typeof globalThis & {
  MonacoEnvironment?: monaco.Environment;
};
let configured = false;

export function configureReactWorkers() {
  if (configured) return;
  configured = true;
  const defaults = monaco.languages.typescript.typescriptDefaults;
  defaults.setCompilerOptions({
    ...defaults.getCompilerOptions(),
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    paths: {
      react: [reactWorkerLibraries[0].filePath],
      "react/jsx-runtime": [reactWorkerLibraries[2].filePath],
      csstype: [reactWorkerLibraries[3].filePath],
    },
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
  });

  for (const { content, filePath } of reactWorkerLibraries)
    defaults.addExtraLib(content, filePath);

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
configureReactWorkers();

loader.config({ monaco });

export { monaco };
