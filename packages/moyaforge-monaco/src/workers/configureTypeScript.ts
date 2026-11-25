import type { CompilerOptions, JsxEmit, ModuleResolutionKind, ScriptTarget } from "@codingame/monaco-vscode-standalone-typescript-language-features";
import reactWorkerLibraries from "virtual:moyaforge-monaco/react-types";

type TypeScriptApi = {
  JsxEmit: { ReactJSX: JsxEmit.ReactJSX };
  ModuleResolutionKind: { NodeJs: ModuleResolutionKind.NodeJs };
  ScriptTarget: { ESNext: ScriptTarget.ESNext };
};

/** Build TSX compiler options and declaration libraries for a worker setup. */
export function configureTypeScript({
  api: { JsxEmit, ModuleResolutionKind, ScriptTarget },
  currentCompilerOptions,
  compilerOptions = {},
  declarationLibraries,
}: {
  api: TypeScriptApi;
  currentCompilerOptions: CompilerOptions;
  compilerOptions?: CompilerOptions;
  declarationLibraries?: Readonly<Record<string, string>>;
}) {
  const { paths, ...overrides } = compilerOptions;
  const options: CompilerOptions = {
    ...currentCompilerOptions,
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
      ...paths,
    },
    jsx: JsxEmit.ReactJSX,
    ...overrides,
  };

  const libraries = {
    ...reactWorkerLibraries,
    "file:///types/styles.d.ts": 'declare module "*.css" {}',
    ...declarationLibraries,
  };
  return { compilerOptions: options, declarationLibraries: libraries };
}
