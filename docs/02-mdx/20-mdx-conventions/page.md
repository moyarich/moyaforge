# Markdown and MDX conventions

MoyaForge documents use `page.mdx` as the route entry point and optional numbered directory prefixes for navigation order. Keep repository-owned documentation in `docs/`; component examples live with UI component docs. The private `apps/playground` application renders the registered content. Numeric folder prefixes determine sibling order without requiring frontmatter `order` fields.

```text
docs/
  page.mdx
  01-getting-started/
    page.mdx
  02-guides/
    page.mdx
    01-configuration/
      page.mdx
```

## Frontmatter

Use `title` as the page name. The registry validates `title`, `description`,
`icon`, `order`, `navigation`, `sidebar`, and `toc`. Titles generate route IDs;
source landing pages keep their source-root URL. Page-level `label` and
`sidebar.label` are not supported.

```mdx
---
title: Get started with MoyaForge
description: Install and configure the documentation framework.
navigation: visible
toc:
  placement: right
  minDepth: 2
  maxDepth: 3
  collapsible: true
  defaultOpen: true
---

# Get started with MoyaForge

Use **Markdown**, tables, fenced code, and MDX components.
```

See [Markdown and MDX](../10-markdown-and-mdx/page.mdx#frontmatter) for the full field reference,
route examples, navigation visibility, source sidebar groups, and TOC settings.

## Shared Vite compiler

Install the supported peer dependencies and use `createMdxOptions` with `@mdx-js/rollup`:

```js
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { createMdxOptions } from "@moyarich/moyaforge-mdx";

export default {
  plugins: [
    { enforce: "pre", ...mdx(createMdxOptions()) },
    react({ include: /\\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
};
```

The shared compiler enables GitHub-flavored Markdown, frontmatter exports, heading slugs and table-of-contents extraction. Add consumer-specific plugins (such as search indexing) locally. Pass the compiled pages to `createMoyaForgeSource` for URL normalization, navigation and search metadata.

The shared MDX components registry supports consumer overrides through `createMdxComponents`; Console keeps ownership of Console-specific components and content.

### Remark plugins and directive helpers

Files and exports prefixed with `remark` are plugin entry points. The compiler registers them through `createMdxOptions`. Use `componentMappings` to configure how an authored directive renders.

| Syntax | Plugin |
| --- | --- |
| Fenced code blocks | Standard Markdown parsing. Preview source collection uses `namedCodeBlock` to identify fences with filenames. |
| `code-group` and its nested `tab` | `remarkMapDirectivesToComponents` maps the group and its tabs to the configured components. |
| `code-preview` and `code-preview-sources` | `remarkMapDirectivesToComponents` calls the preview helpers to collect inline source and load named files. |
| File-backed `preview` | `remarkMapFilePreviewDirectives`, enabled by `filePreviewOptions`. |
