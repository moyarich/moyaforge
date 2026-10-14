# @moyarich/moyaforge-mdx

Independent Markdown and MDX compiler conventions shared by Console, moyaForge, css-expand-collapse, and css-color-parser.

This package does **not** depend on `@moyarich/console` or `@moyarich/moyaforge`.

```ts
import { createMdxOptions } from "@moyarich/moyaforge-mdx";
import mdx from "@mdx-js/rollup";
import remarkCodeGroup from "./remarkCodeGroup";
import rehypeShiki from "@shikijs/rehype";

const options = createMdxOptions({
  remarkPlugins: [remarkCodeGroup],
  rehypePlugins: [rehypeShiki],
});
const plugin = mdx(options);
```

Shared defaults cover GFM, YAML frontmatter export, heading slugs, and table-of-contents extraction/export. Consumers supply their own plugins for custom transforms, syntax highlighting, and search indexing, and own their registries, navigation, and routing.
