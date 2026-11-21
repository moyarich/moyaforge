---
title: Markdown file preview
---

# Markdown file preview

The `component` attribute selects the live React component. The nested `code-preview-sources` directive lists the files shown in the Code view.

::::code-preview[Greeting]{component="./GreetingCard.tsx"}

::code-preview-sources{files="./markdown-file-preview-usage.md,./GreetingCard.tsx,./greeting-card.css,./greeting-message.ts" replacements="portable"}

::::

## Preview source code without rendering it

Use the `code` attribute to display a source file as highlighted code without importing it as a React component.

::::code-preview[Greeting source]{code="./GreetingCard.tsx" language="typescript"}

::code-preview-sources{files="./source-only-example.md"}

::::
