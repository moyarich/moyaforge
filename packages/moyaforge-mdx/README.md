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

## Optional Vite registry discovery

The `mdxRegistryPlugin` reads source rules from the consuming application's `registry.config.ts` and exposes two virtual modules:

- `virtual:moyaforge-mdx/registry` retains the existing eager `sources[name].pages` module map and `lazyPages` for compatibility.
- `virtual:moyaforge-mdx/lazy-registry` exports **only** `sources[name].lazyPages`. Its page values are functions returning dynamic `import()` promises, so importing the manifest does not itself statically import the compiled page modules.

```js
import { sources } from "virtual:moyaforge-mdx/lazy-registry";

const page = await sources.docs.lazyPages["01-getting-started/page.mdx"]();
// Render page.default using your application framework.
```

Both modules use the same configured content roots and reload when content files are added or removed. Lazy importing does not yet provide precomputed frontmatter, routes, search data, or TOCs; those are separate registry-normalization integration tasks tracked in issue #27. Existing eager consumers should migrate before the legacy module is removed.

## Build-time page metadata

`discoverContent(registry, projectRoot)` reads authored YAML from `page.md` and `page.mdx`, validates the schema through the headless page registry and derives routable pages, visible navigation, labels and ordering without executing MDX.

When using `mdxRegistryPlugin`, applications can import the metadata-only virtual module:

```ts
import { sources, pages, routes, navigation } from "virtual:moyaforge-mdx/metadata";
```

These are plain JSON-compatible records with no React component imports. The existing `virtual:moyaforge-mdx/lazy-registry` supplies page loaders separately. Pages marked `navigation: disabled` appear in the complete `pages` inventory but are excluded from `routes` and `navigation`. Hidden pages remain routable but are not in navigation.

Metadata is authored once in YAML, not in `package.json` or a required MDX JavaScript export. Compiler frontmatter exports remain temporarily for legacy consumers; migration away from them is tracked in #27.
