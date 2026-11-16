# @moyarich/moyaforge-monaco

Optional Monaco worker integration, independent of the MDX compiler.

## React Monaco only

```ts
import { monacoReactTypesPlugin } from "@moyarich/moyaforge-monaco/vite";
import { configureReactWorkers } from "@moyarich/moyaforge-monaco/react";

configureReactWorkers();
// Add monacoReactTypesPlugin(projectRoot) to Vite plugins.
```

Import `@moyarich/moyaforge-monaco/react/auto` for automatic standalone setup.

## TypeFox only

```ts
import { configureTypeFoxWorkers } from "@moyarich/moyaforge-monaco/typefox";

configureTypeFoxWorkers();
```

Import `@moyarich/moyaforge-monaco/typefox/auto` for automatic standalone setup.

## React Monaco and TypeFox together

Initialize **one VS Code-compatible Monaco runtime** for both editors, instead of
configuring both standalone worker providers. The shared entry uses
`@codingame/monaco-vscode-editor-api` for `@monaco-editor/react` and TypeFox,
and uses the TypeFox worker factory for compatible language workers.

**Await the async initialization before either editor mounts:**

```tsx
import { createRoot } from "react-dom/client";
import { initializeSharedMonaco } from "@moyarich/moyaforge-monaco/shared";
import { App } from "./App.js";

await initializeSharedMonaco();

createRoot(document.getElementById("root")!).render(<App />);
```

```tsx
import { MonacoEditorReact } from "./components/ui/MonacoEditorReact/index.js";
import { MonacoEditorTypeFox } from "./components/ui/MonacoEditorTypeFox/index.js";

export function App() {
  return (
    <>
      <MonacoEditorReact files={[{ name: "react.tsx", value: "const a = 1;" }]} />
      <MonacoEditorTypeFox files={[{ name: "typefox.tsx", value: "const b = 2;" }]} />
    </>
  );
}
```

Do not additionally import `/react/auto` or `/typefox/auto` when using
the shared entry. `initializeSharedMonaco()` configures the compatible
workers and starts VS Code services once. `configureSharedMonacoWorkers()`
only configures the workers, so it is not sufficient before mounting both
editors.

The two editors share a Monaco runtime and worker **scripts/protocol**;
each language service may still create its own Worker instance. Install the
optional peers needed by both integrations, including
`@codingame/monaco-vscode-editor-api` and the matching
`@codingame/monaco-vscode-standalone-*` versions.

## Virtual module

The Vite plugin provides `virtual:moyaforge-monaco/react-types`
containing React, React DOM and `csstype` declarations for TSX workers.
Add `@moyarich/moyaforge-monaco/virtual` to `compilerOptions.types` and
register `monacoReactTypesPlugin(projectRoot)` in your Vite config.
