# MDX preview helpers

The reusable layout is `PreviewInteractive` in `moyaforge-ui`. This folder
contains only virtual registries, MDX body rendering, and frontmatter-specific
demos. Controls, metadata, source tabs, and resize behavior belong to the UI component.

```tsx
import { PreviewInteractive } from "@moyarich/moyaforge-ui/components/PreviewInteractive";
import "@moyarich/moyaforge-ui/components/PreviewInteractive/styles.css";
import { createVirtualRegistry } from "./PreviewMdx/index.js";

const { files, registry } = createVirtualRegistry({
  handbook: {
    "page.md": "---\ntitle: Handbook\n---\n\n# Handbook\n",
    "01-setup/page.mdx": "---\ntitle: Setup\n---\n\n# Setup\n",
  },
});

export function RegistryExample() {
  return (
    <PreviewInteractive
      title="Virtual handbook"
      files={files}
      metadata={<p>{registry.routes.length} routable pages</p>}
      primaryFile="handbook/page.md"
    >
      <ul>
        {registry.navigation.map((page) => (
          <li key={page.path}>{page.title}</li>
        ))}
      </ul>
    </PreviewInteractive>
  );
}
```

`createVirtualRegistry` accepts any source keys and source-relative Markdown/MDX
filenames. It parses YAML frontmatter and runs the real registry validator and
builder, returning the isolated registry and flattened source files. No disk
writes, application routing, or content discovery occur. Ordinary Markdown
without frontmatter uses registry defaults. Invalid metadata throws with its
virtual filename attached.

The frame can also display an arbitrary file map without using a virtual
registry. Syntax highlighting follows each filename's extension. `primaryFile`
only controls source-tab order. Supply `controls`, `metadata`, and `children`
independently; use `metadataTitle`, `previewDescription`, and `sourceDescription`
to name the displayed regions.

The `frontmatter/` folder owns the guide's fixtures, controls, and sidebar/outline
renderers. Import those demos through its `index.ts` so their stylesheet loads.
Keep new subject-specific demos separate from the shared frame and registry.

Author the shared example documents in `frontmatter/examples/docs/`. Import
those files with Vite's `?raw` suffix instead of copying their contents into
TypeScript. Interactive controls override only YAML metadata; source tabs and
rendering consume the same resulting documents. Extract outlines from those
same documents instead of maintaining a separate heading list.

`VirtualPage` renders a virtual document's Markdown or MDX body. It strips YAML
from the rendered output, supports GFM, and generates scoped heading anchors.
Pass `source`, `filename`, and optional `components` for MDX JSX. Source code
is evaluated as MDX, so only pass trusted documentation. Application module
imports are not resolved from the virtual registry.
