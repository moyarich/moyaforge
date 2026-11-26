# @moyarich/moyaforge-monaco

Headless Monaco React and TypeFox editor runtimes, with models and application-level worker integration. Reusable tabs, toolbar, breadcrumbs and actions live in `@moyarich/moyaforge-ui`.

## Package entry points

| Import suffix | Purpose |
| --- | --- |
| `/components/MonacoEditorReact` | Headless React Monaco editor |
| `/components/MonacoEditorTypeFox` | Headless TypeFox editor backed by VS Code services |
| `/styles.css` | Combined Monaco component styles |
| `/workers/configureReactWorkers` | Standalone React Monaco worker setup |
| `/workers/configureTypeFoxWorkers` | Standalone TypeFox worker setup |
| `/workers/createMonacoVscodeWorkerConfig` | Lazy worker loaders for host-managed registration |
| `/runtime/initializeMonacoVscodeRuntime` | Shared VS Code-compatible runtime for React Monaco and TypeFox |
| `/vite/monacoReactTypesPlugin` | Vite plugin that supplies React declarations to the editor |
| `/vite/react-types` | Type declaration for the Vite virtual module |

## Application setup

Pick the startup function for the editors your app mounts. Call it once at
application startup, before rendering. Install the optional peers for that
setup and configure the [Vite plugin](#vite).

| Editors | Monaco runtime | Startup function |
| --- | --- | --- |
| React Monaco only | Microsoft's `monaco-editor` | `configureReactWorkers()` |
| TypeFox only | `@codingame/monaco-vscode-editor-api` | `configureTypeFoxWorkers()` |
| Both | One shared `@codingame/monaco-vscode-editor-api` instance | `await initializeMonacoVscodeRuntime()` |

Microsoft's package provides a standalone browser editor with models and
language workers. CodinGame's compatible editor API can integrate with VS Code
services such as workspace files, TextMate grammars, and a web extension host.
[Microsoft Monaco Editor](https://github.com/microsoft/monaco-editor) · [CodinGame setup guide](https://github.com/CodinGame/monaco-vscode-api/wiki/Getting-started-guide)

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

The [shared initializer](./src/runtime/initializeMonacoVscodeRuntime.ts) installs
one VS Code-compatible worker factory, points `@monaco-editor/react` at the
same Monaco instance used by TypeFox, and starts VS Code services. It caches
the initialization promise. Call only this initializer when mounting both
editors.

## Custom workers

React Monaco accepts the native `monaco.Environment` configuration. A host-provided `getWorker` or `getWorkerUrl` takes precedence over the built-in factory.

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

TypeFox and the shared runtime accept the native `WorkerFactoryConfig` from `monaco-languageclient/workerFactory`. Additional `workerLoaders` extend the defaults, and matching labels override them.

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

For both editors, pass `workerLoaders` to `initializeMonacoVscodeRuntime()`. Custom workers must implement the protocol expected by the requesting language service.

For a host that manages worker registration itself, import `createMonacoVscodeWorkerConfig(config)` from `@moyarich/moyaforge-monaco/workers/createMonacoVscodeWorkerConfig`. It returns the merged worker configuration without registering workers or changing TypeScript defaults.

## TypeScript options

All three startup functions accept a `typescript` object. Use `compilerOptions`
to override compiler defaults and `declarationLibraries` to add declarations
keyed by virtual file URI. Compiler `paths` merge by module name, and declaration
libraries merge by URI. Your entries win when a key matches a built-in entry.

```ts
configureReactWorkers({
  typescript: {
    compilerOptions: { strict: true },
    declarationLibraries: {
      "file:///types/app.d.ts": "declare const appVersion: string;",
    },
  },
});
```

## Vite

Add the plugin to your Vite config alongside your existing plugins. Pass the
project directory so it can resolve React, React DOM, and `csstype` declarations.

```ts
import { defineConfig } from "vite";
import { monacoReactTypesPlugin } from "@moyarich/moyaforge-monaco/vite/monacoReactTypesPlugin";

export default defineConfig({
  plugins: [monacoReactTypesPlugin(import.meta.dirname)],
});
```

Add `@moyarich/moyaforge-monaco/vite/react-types` to `compilerOptions.types` in
your TypeScript configuration. The plugin supplies the virtual module
`virtual:moyaforge-monaco/react-types` used by the startup functions.

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
