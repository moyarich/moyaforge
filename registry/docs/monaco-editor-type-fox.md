# MonacoEditorTypeFox

Multi-file editor using `@typefox/monaco-editor-react` and VS Code services.

The CLI and shadcn install runtime dependencies. In an existing React app:

```sh
npm install @typefox/monaco-editor-react@~8.0.2 monaco-languageclient@~11.0.2 @codingame/monaco-vscode-editor-api@^37.6.1 lucide-react
```

Configure workers once in the application entry point with `configureTypeFoxWorkers()` from `@moyarich/moyaforge-monaco/typefox`. For applications using both editors, call `initializeSharedMonaco()` from `/shared` instead. Install compatible standalone language features.

Import `MonacoEditorTypeFox` from `./MonacoEditorTypeFox`. Pass `files` with unique names, optional per-file `readOnly`, and `onSave` to persist changes. `readOnly` locks the workspace. `vscodeApiConfig` customizes host services; all instances share the application's VS Code service initialization.

`languageClientConfig` forwards the optional TypeFox `LanguageClientConfig` unchanged to the underlying editor for Language Server Protocol (LSP) integration. The host must provide a reachable language server and transport; this component does not start a server. If both Monaco integrations are used, initialize shared services once before mounting either editor.
