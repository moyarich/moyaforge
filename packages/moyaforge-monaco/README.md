# @moyarich/moyaforge-monaco

Standalone Monaco React and TypeFox editor components plus application-level worker integration, independent of the MDX compiler.

## Package entry points

| Import | Purpose |
| --- | --- |
| `/components/MonacoEditorReact` | React Monaco editor, code group, file workspace |
| `/components/MonacoEditorTypeFox` | TypeFox editor backed by VS Code services |
| `/styles.css` | Combined Monaco component styles |
| `/react` | Standalone `@monaco-editor/react` workers |
| `/typefox` | Standalone TypeFox workers |
| `/shared` | One VS Code-compatible runtime for React Monaco + TypeFox |
| `/vite` | Vite plugin for TSX worker declarations |
| `/virtual` | TypeScript declarations for the Vite virtual module |

Choose **one** runtime strategy and initialize it at application startup,
before mounting editors. There are no implicit `/auto` entry points.

### React Monaco only

```ts
import { configureReactWorkers } from "@moyarich/moyaforge-monaco/react";

configureReactWorkers();
```

### TypeFox only

```ts
import { configureTypeFoxWorkers } from "@moyarich/moyaforge-monaco/typefox";

configureTypeFoxWorkers();
```

### Both editor integrations

```tsx
import { createRoot } from "react-dom/client";
import { initializeSharedMonaco } from "@moyarich/moyaforge-monaco/shared";
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
`getWorkerUrl` and `getWorkerOptions`. Instead of deleting or overwriting
the competing callback, the package reports a clear configuration error.
Worker scripts and protocol can be shared without sharing Worker instances.

## Vite

Register `monacoReactTypesPlugin(projectRoot)` from
`@moyarich/moyaforge-monaco/vite` in `vite.config.ts` and add
`@moyarich/moyaforge-monaco/virtual` to `compilerOptions.types`.
The plugin provides `virtual:moyaforge-monaco/react-types` with
React, React DOM and `csstype` declarations for Monaco's TSX worker.
Install the optional peers for the runtime strategy you choose.

## Components

```tsx
import { MonacoEditorReact } from "@moyarich/moyaforge-monaco/components/MonacoEditorReact";
import { MonacoEditorTypeFox } from "@moyarich/moyaforge-monaco/components/MonacoEditorTypeFox";
```

Both components, their shared file workspace, loading states, and styles are
published from this package. The separate MoyaForge UI package does not need
Monaco to render unrelated components. If both editor engines are mounted,
initialize the shared runtime once at the application entry point.
