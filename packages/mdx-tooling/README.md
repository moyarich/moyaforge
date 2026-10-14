# @moyarich/mdx-tooling

Independent Markdown/MDX compiler conventions shared across applications.
This package has **no dependency on `@moyarich/console` or `@moyarich/moyaforge`**.

```ts
import { createMdxOptions } from "@moyarich/mdx-tooling";
import mdx from "@mdx-js/rollup";\n// Import host plugins from your own app as needed.

const options = createMdxOptions({\n  remarkPlugins: [mySearchOrCodeGroupPlugin],\n  rehypePlugins: [myShikiPlugin],\n});
// Add application-specific remark plugins before remark-mdx-frontmatter if needed.
const plugin = mdx(options);
```

Provides GFM, YAML frontmatter export, heading slugs and TOC extraction/export.
Extra plugins run in a deterministic order: custom remark plugins precede the frontmatter exporter, and custom rehype plugins follow heading slugs and TOC exports.\n\nThe host owns its navigation, registry, routing and search indexing.
