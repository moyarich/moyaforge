## MonacoEditorReact setup

Use MonacoEditorReact inside a React application. If dependencies were not installed
by your component installer (for example, `--no-install`), run:

```sh
npm install @monaco-editor/react monaco-editor lucide-react
```

Your application also needs `react` and `react-dom`. With TypeScript, install
`@types/react` and `@types/react-dom` as development dependencies.

Import the real editor directly from the installed source:

```tsx
import { MonacoEditorReact } from "@/components/ui/components/MonacoEditorReact/MonacoEditorReact";
```

Adjust the import for your component destination and path aliases. Component CSS
is imported automatically. Configure Monaco workers before mounting the editor:
the Vite example on the Monaco documentation page provides a complete `setup.ts`
using local workers and `loader.config({ monaco })`. Other bundlers need their
own worker configuration; importing the component does not configure workers.

The lightweight `Monaco` shell with a textarea renderer does not need an editor
engine. `MonacoEditorTypeFox` is a separate full editor and additionally needs
`@typefox/monaco-editor-react` and `monaco-languageclient`; these are not needed
by the direct MonacoEditorReact implementation.

Guide and complete worker setup:
https://github.com/moyarich/moyaforge/tree/main/packages/moyaforge-ui/docs/01-components/20-monaco-editor-react
