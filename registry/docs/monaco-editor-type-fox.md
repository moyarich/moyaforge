# MonacoEditorTypeFox

Multi-file editor using `@typefox/monaco-editor-react` and VS Code services.

The CLI and shadcn install runtime dependencies. In an existing React app:

```sh
npm install @typefox/monaco-editor-react@~8.0.2 monaco-languageclient@~11.0.2 @codingame/monaco-vscode-editor-api@^37.6.1 lucide-react
```

Configure Monaco workers before mounting the editor. The documentation's `setup.ts` shows a Vite setup with optional standalone TypeScript, CSS, HTML, and JSON language features; install every feature package imported by that setup at version `^37.6.1`.

Import `MonacoEditorTypeFox` from `./MonacoEditorTypeFox`. Pass `files` with unique names, optional per-file `readOnly`, and `onSave` to persist changes. `readOnly` locks the workspace. `vscodeApiConfig` customizes host services; all instances share the application's VS Code service initialization.
