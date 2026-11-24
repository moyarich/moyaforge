---
title: Markdown file preview
---

# Markdown file preview

The `component` attribute selects the live React component. The nested `preview-code-sources` directive lists the files shown in the Code view.

::::preview-code[Greeting]{component="./GreetingCard.tsx"}

::preview-code-sources{files="./markdown-file-preview-usage.md,./GreetingCard.tsx,./greeting-card.css,./greeting-message.ts" replacements="portable"}

::::

## Preview source code without rendering it

Use the `code` attribute to display a source file as highlighted code without importing it as a React component.

::::preview-code[Greeting source]{code="./GreetingCard.tsx" language="typescript"}

::preview-code-sources{files="./source-only-example.md"}

::::
