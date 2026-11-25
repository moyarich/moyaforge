# @moyarich/moyaforge-monaco

Headless Monaco React and TypeFox editor runtimes, with models and application-level worker integration. Reusable tabs, toolbar, breadcrumbs and actions live in `@moyarich/moyaforge-ui`.

## Package entry points

| Import                                    | Purpose                                                             |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `/components/MonacoEditorReact`           | Headless React Monaco editor runtime                                |
| `/components/MonacoEditorTypeFox`         | Headless TypeFox editor runtime backed by VS Code services          |
| `/styles.css`                             | Combined Monaco component styles                                    |
| `/workers/configureReactWorkers`          | Standalone `@monaco-editor/react` workers                           |
| `/workers/configureTypeFoxWorkers`        | Standalone TypeFox workers and TypeScript defaults                  |
| `/workers/createMonacoVscodeWorkerConfig` | Build lazy VS Code-compatible worker loaders for host-managed setup |
| `/runtime/initializeMonacoVscodeRuntime`  | One VS Code-compatible runtime for React Monaco + TypeFox           |
| `/vite/monacoReactTypesPlugin`            | Vite plugin for TSX worker declarations                             |
| `/vite/react-types`                       | TypeScript declarations for the Vite virtual module                 |

Choose **one** runtime strategy and initialize it at application startup,
before mounting editors.

### React Monaco only

```ts
import { configureReactWorkers } from "@moyarich/moyaforge-monaco/workers/configureReactWorkers";

configureReactWorkers();
```

### TypeFox only

```ts
import { configureTypeFoxWorkers } from "@moyarich/moyaforge-monaco/workers/configureTypeFoxWorkers";

configureTypeFoxWorkers();
```

### Both editor integrations

```tsx
import { createRoot } from "react-dom/client";
import { initializeMonacoVscodeRuntime } from "@moyarich/moyaforge-monaco/runtime/initializeMonacoVscodeRuntime";
import { App } from "./App.js";

await initializeMonacoVscodeRuntime();

createRoot(document.getElementById("root")!).render(<App />);
```

`initializeMonacoVscodeRuntime()` configures TypeFox's worker factory, points
`@monaco-editor/react` at the same VS Code-compatible editor API, and
initializes VS Code services once. It caches one initialization promise.
Do not also call either standalone initializer.

Monaco prefers `MonacoEnvironment.getWorker` over `getWorkerUrl` if both
exist. The standalone React integration uses `getWorker`; TypeFox uses
`getWorkerUrl` and `getWorkerOptions`. The package reports a configuration error if competing worker strategies are detected.
Worker scripts and protocol can be shared without sharing Worker instances.

## Custom workers

React Monaco accepts the native `monaco.Environment` configuration. A host-provided `getWorker` or `getWorkerUrl` takes precedence over the built-in factory. Pass `typescript.compilerOptions` in the same object to override TypeScript defaults.

```ts
import {
  configureReactWorkers,
  getDefaultReactWorker,
} from "@moyarich/moyaforge-monaco/workers/configureReactWorkers";
import CustomWorker from "./custom.worker?worker";

configureReactWorkers({
  getWorker(moduleId, label) {
    if (label === "custom") return new CustomWorker();
    return getDefaultReactWorker(moduleId, label);
  },
});
```

TypeFox and the shared runtime accept the native `WorkerFactoryConfig` from `monaco-languageclient/workerFactory`. Additional `workerLoaders` extend the defaults, and matching labels override them. Pass `typescript.compilerOptions` to override TypeScript defaults, for example `{ typescript: { compilerOptions: { strict: true } } }`. Custom `paths` entries merge with the built-in React type paths.

```ts
import { Worker } from "monaco-languageclient/workerFactory";
import { configureTypeFoxWorkers } from "@moyarich/moyaforge-monaco/workers/configureTypeFoxWorkers";
import CustomWorkerUrl from "./custom.worker.ts?worker&url";

configureTypeFoxWorkers({
  workerLoaders: {
    custom: () =>
      new Worker(new URL(CustomWorkerUrl, import.meta.url), { type: "module" }),
  },
});
```

For an application using both editors, pass the same TypeFox configuration to `initializeMonacoVscodeRuntime(config)` instead. Configure the runtime before mounting editors; the first initialization owns worker configuration. Custom workers must implement the protocol expected by the requesting service. Register any additional language contributions or providers through Monaco or TypeFox's native APIs.

For a host that manages worker registration itself, import `createMonacoVscodeWorkerConfig(config)` from `@moyarich/moyaforge-monaco/workers/createMonacoVscodeWorkerConfig`. It returns the merged worker configuration without registering workers or changing TypeScript defaults.

All three setup functions also accept `typescript.declarationLibraries`, a map from virtual file URIs to declaration source. Entries with the same URI as a built-in library replace it.

```ts
configureReactWorkers({
  typescript: {
    declarationLibraries: {
      "file:///types/app.d.ts": "declare const appVersion: string;",
    },
  },
});
```

## Vite

Register `monacoReactTypesPlugin(projectRoot)` from
`@moyarich/moyaforge-monaco/vite/monacoReactTypesPlugin` in `vite.config.ts` and add
`@moyarich/moyaforge-monaco/vite/react-types` to `compilerOptions.types`.
The plugin provides `virtual:moyaforge-monaco/react-types` with
React, React DOM and `csstype` declarations for Monaco's TSX worker.
Install the optional peers for the runtime strategy you choose.

## Components

```tsx
import { MonacoEditorReact } from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";
import { MonacoEditorTypeFox } from "@moyarich/moyaforge-monaco/components/MonacoEditorTypeFox";
```

These components render editor content only; they do not provide tabs, a toolbar, Save or Copy controls. Mount them inside `EditorPanel` from `moyaforge-ui`, or import the ready-to-compose `MonacoEditorPanel` and `TypeFoxEditorPanel` wrappers from that package. File selection is controlled with `activeFile`; external updates arrive through the `files` prop and edits through `onFileChange`.

For example:

```tsx
import { MonacoEditorPanel } from "@moyarich/moyaforge-ui/components/MonacoEditorPanel";

<MonacoEditorPanel
  files={files}
  onFileChange={(name, value) =>
    setFiles((current) =>
      current.map((file) => (file.name === name ? { ...file, value } : file)),
    )
  }
  height={320}
  showBreadcrumbs
/>;
```

When mounting both editor engines, initialize their shared runtime once at the application entry point.

`monaco-editor` gives you **a standalone browser editor**. `@codingame/monaco-vscode-editor-api` gives you **a Monaco-compatible editor that can run with VS Code services**.

| Package                               | What you get                                                                                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `monaco-editor`                       | Microsoft’s standalone editor, with text models, syntax highlighting, and built-in language workers. [Microsoft Monaco Editor](https://github.com/microsoft/monaco-editor)                                                                                    |
| `@codingame/monaco-vscode-editor-api` | A compatible editor API that integrates with separately configured VS Code services, such as workspace files, TextMate grammars, and a web extension host. [CodinGame setup guide](https://github.com/CodinGame/monaco-vscode-api/wiki/Getting-started-guide) |

In **MoyaForge**, `configureReactWorkers()` uses Microsoft’s standalone runtime.
TypeFox uses CodinGame’s runtime. When both editor components run together on the same page, `initializeMonacoVscodeRuntime()` gives the React component the same CodinGame instance that TypeFox uses. That lets both components use one runtime and one worker configuration. [Shared runtime](./packages/moyaforge-monaco/src/runtime/initializeMonacoVscodeRuntime.ts)
