# Virtual MDX preview utilities

These private documentation utilities build isolated registries and render trusted Markdown and MDX. Keep example components, styles, and authored documents beside their owning documentation page under `examples/`. Shared examples may import the canonical files from another guide; do not duplicate their contents.

Use `PreviewInteractive` from `moyaforge-ui` for layout. Import authored Markdown with `?raw`, apply interactive metadata changes in memory, and use the same source for rendering and source tabs. Derive heading IDs with the existing heading extractor. Example documents must not be registered as site routes.
