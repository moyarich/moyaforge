## MonacoEditorReact setup

`MonacoEditorReact` is a headless React Monaco runtime. It owns editor models, file drafts, worker integrations, language inference and read-only behavior, but it **does not render tabs, Copy, Save or toolbar controls**.

Install the Monaco runtime and optional UI workspace:

```sh
npm install @moyarich/moyaforge-monaco @moyarich/moyaforge-ui @monaco-editor/react monaco-editor
```

Import the visual workspace from `moyaforge-ui`:

```tsx
import { MonacoEditorWorkspace } from "@moyarich/moyaforge-ui/components/MonacoEditorWorkspace";

<MonacoEditorWorkspace
  files={files}
  onFileChange={(name, value) => setFiles(current => current.map(file => file.name === name ? { ...file, value } : file))}
  height={320}
/>;
```

For a custom shell, import `MonacoEditorReact` from `@moyarich/moyaforge-monaco/components/MonacoEditorReact` and pass an active file. The runtime does not take `onSave`, `showFileTabs`, or `showCopyButton`.

Configure workers once using `configureReactWorkers()` from `@moyarich/moyaforge-monaco/react`. When using TypeFox too, initialize the shared VS Code-compatible runtime via `initializeSharedMonaco()` from `@moyarich/moyaforge-monaco/shared` instead.

Guide and worker setup: https://github.com/moyarich/moyaforge/tree/main/packages/moyaforge-ui/docs/01-components/200-monaco-editor-react
