# @moyarich/moyaforge-monaco

Headless Monaco React and TypeFox editor runtimes, with models and application-level worker integration. Reusable tabs, toolbar, breadcrumbs and actions live in `@moyarich/moyaforge-ui`.

## Package entry points

| Import | Purpose |
| --- | --- |
| `/components/MonacoEditorReact` | Headless React Monaco editor runtime |
| `/components/MonacoEditorTypeFox` | Headless TypeFox editor runtime backed by VS Code services |
| `/styles.css` | Combined Monaco component styles |
| `/workers/configureReactWorkers` | Standalone `@monaco-editor/react` workers |
| `/workers/configureTypeFoxWorkers` | Standalone TypeFox workers |
| `/runtime/initializeSharedMonaco` | One VS Code-compatible runtime for React Monaco + TypeFox |
| `/vite/monacoReactTypesPlugin` | Vite plugin for TSX worker declarations |
| `/vite/react-types` | TypeScript declarations for the Vite virtual module |

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
import { initializeSharedMonaco } from "@moyarich/moyaforge-monaco/runtime/initializeSharedMonaco";
import { App } from "./App.js";

await initializeSharedMonaco();

createRoot(document.getElementById("root")!).render(<App />);
```

`initializeSharedMonaco()` configures TypeFox's worker factory, points
`@monaco-editor/react` at the same VS Code-compatible editor API, and
initializes VS Code services once. It caches one initialization promise.
Do not also call either standalone initializer.

Monaco prefers `MonacoEnvironment.getWorker` over `getWorkerUrl` if both
exist. The standalone React integration uses `getWorker`; TypeFox uses
`getWorkerUrl` and `getWorkerOptions`. The package reports a configuration error if competing worker strategies are detected.
Worker scripts and protocol can be shared without sharing Worker instances.

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
    custom: () => new Worker(
      new URL(CustomWorkerUrl, import.meta.url),
      { type: "module" },
    ),
  },
});
```

For an application using both editors, pass the same TypeFox configuration to `initializeSharedMonaco(config)` instead. Configure the runtime before mounting editors; the first initialization owns worker configuration. Custom workers must implement the protocol expected by the requesting service. Register any additional language contributions or providers through Monaco or TypeFox's native APIs.

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
  onFileChange={(name, value) => setFiles(current => current.map(file => file.name === name ? { ...file, value } : file))}
  height={320}
  showBreadcrumbs
/>;
```

When mounting both editor engines, initialize their shared runtime once at the application entry point.
