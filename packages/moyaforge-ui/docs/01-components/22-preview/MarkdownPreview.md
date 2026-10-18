# File-backed Preview in Markdown

A host that opts into `createMdxOptions({ previewDirectives: true })` can write:

::: preview Counter

example: ./CounterExample.tsx

source: ./CounterExample.tsx

:::

The directive emits a `PreviewDirective` component with `example`, `source`, and `title` string props. The consuming application must register that component with its MDX provider and resolve the paths using a **trusted, explicit example map**. The directive does not import modules from Markdown, does not evaluate code, and does not add Monaco as a dependency.

For a Vite-based host, a resolver may pre-register examples via `import.meta.glob` with a fixed permitted directory and resolve both a module and `?raw` source. Do not form an arbitrary import URL from untrusted authored Markdown. The rendered example can be wrapped with the canonical Preview slots and optional `PreviewSource asChild` for Monaco.
