# MonacoEditorTypeFox

Headless TypeFox Monaco runtime using VS Code services. Tabs, Save/Copy actions, breadcrumbs and visual editor layout are provided by `moyaforge-ui`, not by the runtime.

Install both the UI and the TypeFox runtime dependencies in your React application:

```sh
npm install @moyarich/moyaforge-ui @moyarich/moyaforge-monaco @typefox/monaco-editor-react@~8.0.2 monaco-languageclient@~11.0.2 @codingame/monaco-vscode-editor-api@^37.6.1
```

```tsx
import { TypeFoxEditorWorkspace } from "@moyarich/moyaforge-ui/components/TypeFoxEditorWorkspace";

<TypeFoxEditorWorkspace
  files={files}
  onFileChange={(name, value) => setFiles(current => current.map(file => file.name === name ? { ...file, value } : file))}
  height={320}
  showBreadcrumbs
/>;
```

For a fully custom shell, use the headless `MonacoEditorTypeFox` from `@moyarich/moyaforge-monaco/components/MonacoEditorTypeFox`. Its `languageClientConfig` forwards the optional `LanguageClientConfig` to the underlying editor. The host must provide the language server and transport.

Configure workers with `configureTypeFoxWorkers()` from `@moyarich/moyaforge-monaco/typefox`, or `initializeSharedMonaco()` from `@moyarich/moyaforge-monaco/shared` when using both editor integrations.
