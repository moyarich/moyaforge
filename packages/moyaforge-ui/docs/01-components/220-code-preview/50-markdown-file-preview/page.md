---
title: Markdown file preview
---

# Markdown file preview

The `component` attribute selects the live React component. The nested `code-preview-sources` directive lists the files shown in the Code view.

::::code-preview[Greeting]{example="./Greeting.tsx"}

::code-preview-sources{files="./example.md,./Greeting.tsx,./styles.css,./config.ts" replacements="portable"}

::::

## Preview source code without rendering it

Use the `code` attribute to display a source file as highlighted code without importing it as a React component.

:::code-preview[Greeting source]{code="./Greeting.tsx" language="typescript"}
:::
